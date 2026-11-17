/**
 * Browser video processing through ffmpeg.wasm.
 *
 * The core (~31 MB wasm) is served from /ffmpeg and only downloaded the first
 * time somebody actually converts a video — every other page stays light.
 * FFmpeg runs in a Web Worker inside the visitor's browser: no upload, no
 * server, no timeout. That is the whole reason this is possible without a
 * backend.
 */

/**
 * No hard size limit: ffmpeg only touches the parts of the file it needs, so a
 * 2 GB source works as long as the device has room. We do warn (not block) for
 * very large files, because decoding still needs memory.
 */
import { rememberVideoEngineReady } from "@/lib/video-engine-notice";
import { createVideoProgress, parseVideoProgressSeconds } from "@/lib/video-progress";

export const LARGE_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
/**
 * Above this we show a soft "this may be slow on a phone" hint. It is only
 * advice — nothing is blocked, since the mounted file is streamed, not copied.
 */
export const VIDEO_MEMORY_HINT_BYTES = 300 * 1024 * 1024; // 300 MB

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/avi",
  "video/x-msvideo",
  "video/mpeg",
  "video/3gpp",
] as const;

export interface VideoInfo {
  name: string;
  size: number;
  type: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}

export interface VideoError {
  error: string;
}

export function isVideoError(value: unknown): value is VideoError {
  return typeof value === "object" && value !== null && "error" in value;
}

/** A small early probe catches unreadable Android picker/cloud references before processing.
 * It does not guarantee every later byte remains readable and never copies the entire file. */
export async function probeVideoFile(file: File): Promise<VideoError | null> {
  if (!file.size) return { error: "این فایل خالی است." };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = Promise.all([file.slice(0, 16).arrayBuffer(), file.slice(Math.max(0, file.size - 16)).arrayBuffer()]);
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("probe-timeout")), 10000); });
    await Promise.race([read, timeout]);
    return null;
  } catch (cause) {
    if (cause instanceof Error && cause.message === "probe-timeout") {
      return { error: "خواندن فایل طول کشید. اگر ویدیو در فضای ابری است ابتدا آن را روی دستگاه ذخیره کنید و از «انتخاب ویدیو از دستگاه» دوباره انتخاب کنید." };
    }
    return { error: "مرورگر نتوانست فایل انتخاب‌شده را بخواند. ویدیو را روی دستگاه ذخیره کنید و از «انتخاب ویدیو از دستگاه» دوباره انتخاب کنید." };
  } finally { if (timer) clearTimeout(timer); }
}

/** Read duration and dimensions in the browser (fast, no ffmpeg needed). */
export async function inspectVideo(file: File): Promise<VideoInfo | VideoError> {
  const looksLikeVideo =
    (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type) ||
    /\.(mp4|mov|webm|mkv|avi|m4v|3gp|mpeg|mpg)$/i.test(file.name);

  if (!looksLikeVideo) {
    return { error: "فقط فایل‌های ویدیویی (MP4، MOV، WebM، MKV، AVI) پذیرفته می‌شوند." };
  }
  if (file.size === 0) {
    return { error: "این فایل خالی است." };
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        const timer = setTimeout(() => { cleanup(); reject(new Error("metadata-timeout")); }, 10000);
        function cleanup() { clearTimeout(timer); video.onloadedmetadata = null; video.onerror = null; }
        video.onloadedmetadata = () => {
          const metadata = {
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            width: video.videoWidth,
            height: video.videoHeight,
          };
          cleanup(); resolve(metadata);
        };
        video.onerror = () => { cleanup(); reject(new Error("metadata")); };
        video.src = url;
      },
    );

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      durationSeconds: info.duration > 0 ? info.duration : null,
      width: info.width || null,
      height: info.height || null,
    };
  } catch {
    // Some containers (mkv/avi) carry no metadata the browser can parse; ffmpeg
    // can still handle them, so we accept the file with unknown dimensions.
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      durationSeconds: null,
      width: null,
      height: null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* -------------------------------------------------------------------------- */
/*  ffmpeg singleton                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Minimal shape of the @ffmpeg/ffmpeg UMD bundle we load at runtime.
 * (Its ESM build embeds `new Worker(new URL(..., import.meta.url))`, which
 * Turbopack cannot resolve — and the 31 MB core must not go through the
 * bundler at all.)
 */
export interface FFmpegInstance {
  loaded: boolean;
  load(config?: { coreURL?: string; wasmURL?: string }): Promise<boolean>;
  exec(args: string[], timeout?: number): Promise<number>;
  writeFile(path: string, data: Uint8Array): Promise<boolean>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<boolean>;
  mount(
    fsType: "WORKERFS" | "MEMFS" | "IDBFS" | "NODEFS" | "PROXYFS" | "NODERAWFS",
    options: { files?: File[]; blobs?: { name: string; data: Blob }[] },
    mountPoint: string,
  ): Promise<boolean>;
  unmount(mountPoint: string): Promise<boolean>;
  createDir(path: string): Promise<boolean>;
  terminate(): void;
  on(event: "log", callback: (payload: { type: string; message: string }) => void): void;
  on(event: "progress", callback: (payload: { progress: number; time: number }) => void): void;
  off(event: "log" | "progress", callback: (payload: never) => void): void;
}

interface FFmpegUmdNamespace {
  FFmpeg: new () => FFmpegInstance;
}

/** Everything in /ffmpeg is copied straight from the npm packages. */
const FFMPEG_SCRIPT_URL = "/ffmpeg/ffmpeg.js";
const FFMPEG_CORE_URL = "/ffmpeg/ffmpeg-core.js";
/**
 * The 30.6 MB core is shipped gzipped (9.7 MB) because static hosts cap a
 * single asset at 25 MiB — Cloudflare Pages/Workers enforce that on every plan.
 * We fetch the .gz, inflate it in the browser with `DecompressionStream`, and
 * hand ffmpeg.wasm a `blob:` URL, so nothing is decompressed by the host and
 * the whole thing still runs locally. Hosts without the cap (and `next dev`)
 * keep the raw `.wasm` and are used as a fallback.
 */
const FFMPEG_WASM_GZ_URL = "/ffmpeg/ffmpeg-core.wasm.gz";
const FFMPEG_WASM_URL = "/ffmpeg/ffmpeg-core.wasm";

/** Fetch the gzipped core and inflate it into a Blob URL. Null if unavailable. */
async function gzippedCoreUrl(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(FFMPEG_WASM_GZ_URL, { signal });
    if (!response.ok || !response.body) return null;
    // `fetch` already undoes any transport Content-Encoding (Cloudflare may
    // gzip/br this response), so `response.body` is always the .gz file itself.
    let blob: Blob;
    if (typeof DecompressionStream !== "undefined") {
      const inflated = response.body.pipeThrough(new DecompressionStream("gzip"));
      blob = await new Response(inflated, { headers: { "Content-Type": "application/wasm" } }).blob();
    } else {
      // Older Safari lacks DecompressionStream. fflate provides an in-browser
      // fallback; it is loaded only when needed and never sends video anywhere.
      const { gunzipSync } = await import("fflate");
      const compressed = new Uint8Array(await response.arrayBuffer());
      const inflated = gunzipSync(compressed);
      blob = new Blob([new Uint8Array(inflated)], { type: "application/wasm" });
    }
    // Guard against a host that 200s an HTML error page instead of the file:
    // a real wasm module starts with 0x00 0x61 0x73 0x6d ("\0asm").
    const magic = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (magic[0] !== 0x00 || magic[1] !== 0x61 || magic[2] !== 0x73 || magic[3] !== 0x6d) {
      return null;
    }
    // ffmpeg.wasm's core fetches `wasmURL` itself, so the bytes must be
    // addressable as a URL rather than passed as an ArrayBuffer.
    return URL.createObjectURL(blob);
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}

let scriptPromise: Promise<FFmpegUmdNamespace> | null = null;

/** Inject the UMD bundle once per page (a plain <script>, not a module). */
function loadFFmpegScript(): Promise<FFmpegUmdNamespace> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = (window as unknown as { FFmpegWASM?: FFmpegUmdNamespace }).FFmpegWASM;
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = FFMPEG_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const namespace = (window as unknown as { FFmpegWASM?: FFmpegUmdNamespace }).FFmpegWASM;
      if (namespace?.FFmpeg) resolve(namespace);
      else reject(new Error("ffmpeg-wasm-missing"));
    };
    script.onerror = () => reject(new Error("ffmpeg-wasm-failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface LoadedFFmpeg {
  ffmpeg: FFmpegInstance;
}

let ffmpegPromise: Promise<LoadedFFmpeg> | null = null;
let activeFFmpeg: FFmpegInstance | null = null;
let loadController: AbortController | null = null;
let engineGeneration = 0;
let conversionActive = false;

function terminateEngine() {
  engineGeneration += 1;
  loadController?.abort();
  loadController = null;
  const instance = activeFFmpeg;
  activeFFmpeg = null;
  ffmpegPromise = null;
  instance?.terminate();
}

/**
 * Load ffmpeg once and reuse it for every conversion in the session. The worker
 * and the (gzipped, locally inflated) core are fetched from /ffmpeg on our own
 * origin, so the site needs no COOP/COEP headers and the 9.7 MB wasm stays out
 * of the JS bundle.
 */
export function loadFFmpeg(onLog?: (line: string) => void): Promise<LoadedFFmpeg> {
  if (ffmpegPromise) return ffmpegPromise;

  const generation = engineGeneration;
  const localLoadController = new AbortController();
  loadController = localLoadController;
  const promise = (async () => {
    if (typeof window === "undefined") throw new Error("client-only");
    const namespace = await loadFFmpegScript();
    if (generation !== engineGeneration) throw new Error("__aborted__");
    const ffmpeg = new namespace.FFmpeg();
    activeFFmpeg = ffmpeg;

    if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));

    const wasmURL = (await gzippedCoreUrl(localLoadController.signal)) ?? FFMPEG_WASM_URL;

    try {
      if (generation !== engineGeneration) throw new Error("__aborted__");
      await ffmpeg.load({ coreURL: FFMPEG_CORE_URL, wasmURL });
    } catch (error) {
      if (generation !== engineGeneration) throw new Error("__aborted__");
      ffmpeg.terminate();
      activeFFmpeg = null;
      console.error("[ffmpeg] engine load failed", error);
      throw new Error("موتور ویدیو بارگذاری نشد. اتصال اینترنت، فضای خالی و مرورگر به‌روز را بررسی کنید؛ اگر مشکل ادامه دارد عکس خطا و مدل گوشی را بفرستید.");
    } finally {
      if (wasmURL.startsWith("blob:")) URL.revokeObjectURL(wasmURL);
    }

    if (loadController === localLoadController) loadController = null;
    rememberVideoEngineReady();
    return { ffmpeg };
  })().catch((error: unknown) => {
    if (ffmpegPromise === promise) ffmpegPromise = null; // do not clear a newer load
    if (loadController === localLoadController) loadController = null;
    if (error instanceof Error && /ffmpeg-wasm-(failed|missing)/.test(error.message)) {
      throw new Error("موتور ویدیو دانلود نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.");
    }
    throw error;
  });

  ffmpegPromise = promise;
  return promise;
}

export interface ConvertOptions {
  /** ffmpeg arguments; the input is always `input.<ext>` and output `output.<ext>`. */
  args: string[];
  inputName: string;
  outputName: string;
  /**
   * Extra ffmpeg passes run after `args`, in the same mounted session (GIF
   * palette generation: pass 1 writes the palette, pass 2 consumes it).
   */
  passes?: string[][];
  /** Retry an MP4 stream-copy operation with re-encoded audio only when its audio codec cannot be muxed. */
  audioFallbackArgs?: string[];
  /** Clip length in seconds — lets us turn ffmpeg's time= output into progress. */
  durationSeconds?: number | null;
  onProgress?: (ratio: number | null) => void;
  /** Called once the engine is ready, including when an existing instance is reused. */
  onEngineReady?: () => void;
  /** Processing phases, not estimates of elapsed time or percent complete. */
  onPhase?: (phase: "processing" | "finalizing" | "retry-audio") => void;
  onLog?: (line: string) => void;
  /** Lets the user cancel a long conversion. */
  signal?: AbortSignal;
}

export interface ConvertResult {
  blob: Blob;
  bytes: number;
  log: string;
  audioConverted: boolean;
}

/**
 * Run one ffmpeg pass over `file` and return the produced file.
 *
 * The input is **mounted** (WORKERFS) instead of copied into MEMFS: a 2 GB
 * upload would otherwise be duplicated in memory, and Emscripten's MEMFS also
 * refuses single writes above 2 GB. Mounting streams the file on demand, so
 * large videos work and memory stays flat.
 *
 * The failure reason is taken from ffmpeg's own log, not from `exec`'s exit
 * code: ffmpeg.wasm reports a failed conversion as exit code 0 in some builds.
 */
export async function convertVideo(
  file: File,
  options: ConvertOptions,
): Promise<ConvertResult> {
  if (conversionActive) throw new Error("پردازش دیگری در حال انجام است؛ ابتدا آن را تمام یا لغو کنید.");
  if (options.signal?.aborted) throw new Error("پردازش لغو شد.");
  conversionActive = true;
  let cancelReject: ((reason: Error) => void) | undefined;
  const cancelled = new Promise<never>((_, reject) => { cancelReject = reject; });
  const abort = () => {
    terminateEngine();
    cancelReject?.(new Error("__aborted__"));
  };
  options.signal?.addEventListener("abort", abort, { once: true });
  let ffmpeg: FFmpegInstance;
  try {
    ({ ffmpeg } = await Promise.race([loadFFmpeg(), cancelled]));
  } catch (error) {
    options.signal?.removeEventListener("abort", abort);
    conversionActive = false;
    if (options.signal?.aborted) throw new Error("پردازش لغو شد.");
    throw error;
  }
  options.onEngineReady?.();
  const logLines: string[] = [];
  const estimateProgress = createVideoProgress(options.durationSeconds);
  let phase = "prepare-input";
  let mounted = false;
  let audioConverted = false;

  const logHandler = ({ message }: { message: string }) => {
    logLines.push(message);
    options.onLog?.(message);
    if (phase === "ffmpeg-exec" && options.durationSeconds) {
      const seconds = parseVideoProgressSeconds(message);
      if (seconds !== null && seconds > 0) options.onProgress?.(estimateProgress(seconds));
    }
  };

  ffmpeg.on("log", logHandler);

  const throwIfAborted = () => {
    if (options.signal?.aborted) throw new Error("__aborted__");
  };

  try {
    throwIfAborted();
    await Promise.race([ffmpeg.createDir("/input").catch(() => undefined), cancelled]);
    // Mount under /input so ffmpeg streams the file instead of copying it.
    phase = "mount-input";
    mounted = await Promise.race([ffmpeg.mount("WORKERFS", { files: [file] }, "/input"), cancelled]);
    if (!mounted) throw new Error("WORKERFS unavailable in this FFmpeg build");

    // WORKERFS exposes the file under its real name, so map our logical
    // `input.<ext>` name onto the mounted path.
    const mountedPath = `/input/${file.name}`;
    const passes = [options.args, ...(options.passes ?? [])].map((pass) =>
      pass.map((arg) => (arg === options.inputName ? mountedPath : arg)),
    );
    throwIfAborted();
    options.onPhase?.("processing");
    phase = "ffmpeg-exec";
    for (const [index, pass] of passes.entries()) {
      let code = await Promise.race([ffmpeg.exec(pass), cancelled]);
      throwIfAborted();
      const firstLog = logLines.join("\n");
      // In the trimmer's stream-copy mapping, output stream #1 is audio.
      // Do not retry a video-codec problem or an unrelated execution failure.
      const audioIncompatible = /could not find tag for codec [^\n]* in stream #1[^\n]*codec not currently supported in container/i.test(firstLog);
      if (index === 0 && options.audioFallbackArgs && code !== 0 && audioIncompatible) {
        options.onPhase?.("retry-audio");
        await Promise.race([ffmpeg.deleteFile(options.outputName).catch(() => undefined), cancelled]);
        throwIfAborted();
        logLines.length = 0;
        const fallback = options.audioFallbackArgs.map(arg => arg === options.inputName ? mountedPath : arg);
        code = await Promise.race([ffmpeg.exec(fallback), cancelled]);
        throwIfAborted();
        if (code === 0) audioConverted = true;
      }
      if (code !== 0) throw new Error(`__ffmpeg_failed__ exit ${code}`);
    }

    // Reading a large output from the worker can take substantial time and memory.
    options.onPhase?.("finalizing");
    phase = "read-output";
    // The output is written to MEMFS (a Blob-backed workdir can't create files).
    const data: Uint8Array | string = await Promise.race([
      ffmpeg.readFile(options.outputName), cancelled,
    ]);

    const bytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(String(data));

    const log = logLines.join("\n");
    if (bytes.length === 0 || /Output file #0 does not contain any stream|Conversion failed/i.test(log)) {
      throw new Error(`__ffmpeg_failed__\n${log}`);
    }

    const blob = new Blob([new Uint8Array(bytes)], {
      type: outputMime(options.outputName),
    });

    await ffmpeg.deleteFile(options.outputName).catch(() => undefined);
    await ffmpeg.unmount("/input").catch(() => undefined);
    mounted = false;

    return { blob, bytes: blob.size, log, audioConverted };
  } catch (error) {
    if (!options.signal?.aborted) {
      await ffmpeg.deleteFile(options.outputName).catch(() => undefined);
      if (mounted) await ffmpeg.unmount("/input").catch(() => undefined);
    }

    // The ffmpeg worker rejects with a string, not necessarily an Error object.
    const message = error instanceof Error ? error.message : String(error ?? "unknown error");
    const technical = message.startsWith("__ffmpeg_failed__\n") ? "FFmpeg returned no usable output" : message;
    options.onLog?.(`\n[${phase}] ${technical.slice(0, 1500)}`);
    const log = logLines.join("\n");

    if (options.signal?.aborted || message.startsWith("__aborted__")) {
      throw new Error("پردازش لغو شد.");
    }
    if (/NotReadableError|readAsArrayBuffer.*could not be read|requested file could not be read/i.test(message)) {
      throw new Error("مرورگر دسترسی خواندن این فایل را ندارد. ویدیو را روی دستگاه ذخیره کنید و با «انتخاب ویدیو از دستگاه» دوباره انتخاب کنید. اگر مشکل ادامه داشت، مجوز دسترسی فایل و سلامت آن را بررسی کنید.");
    }
    if (/does not contain any stream|Output file #0 does not contain/i.test(log)) {
      throw new Error("فایل خروجی جریان قابل استفاده‌ای ندارد؛ فایل دیگری را امتحان کنید یا گزارش فنی را بررسی کنید.");
    }
    if (/Invalid data found|moov atom not found|could not find codec parameters/i.test(log)) {
      throw new Error("فایل ویدیو خوانده نشد؛ ممکن است ناقص یا خراب باشد.");
    }
    if (/memory|allocate|RangeError|out of memory/i.test(`${message}\n${log}`)) {
      throw new Error(
        "حافظهٔ این دستگاه برای این فایل کافی نبود. رزولوشن یا طول ویدیو را کمتر کنید یا با کامپیوتر امتحان کنید.",
      );
    }
    if (/WORKERFS unavailable/i.test(message)) {
      throw new Error("موتور پردازش نتوانست فایل را باز کند؛ جزئیات فنی را برای بررسی ارسال کنید.");
    }
    if (/could not find tag for codec|not currently supported in container|codec not supported/i.test(log)) {
      throw new Error("کدک فایل با فرمت خروجی سازگار نیست؛ یک فرمت دیگر را امتحان کنید.");
    }
    // Keep the technical reason in the console only; users see Persian text.
    console.error("[ffmpeg]", message, log.split("\n").slice(-25).join("\n"));
    throw new Error("پردازش فایل انجام نشد. برای بررسی علت، جزئیات فنی را باز کنید و چند خط آخر گزارش را ارسال کنید.");
  } finally {
    ffmpeg.off("log", logHandler);
    options.signal?.removeEventListener("abort", abort);
    conversionActive = false;
  }
}

function outputMime(name: string): string {
  if (name.endsWith(".mp3")) return "audio/mpeg";
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".m4a")) return "audio/mp4";
  if (name.endsWith(".ogg")) return "audio/ogg";
  if (name.endsWith(".flac")) return "audio/flac";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".mkv")) return "video/x-matroska";
  if (name.endsWith(".jpg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  return "video/mp4";
}

/* -------------------------------------------------------------------------- */
/*  Presets                                                                   */
/* -------------------------------------------------------------------------- */

export interface CompressionPreset {
  id: string;
  label: string;
  hint: string;
  /** Target height in pixels; null keeps the source size. */
  height: number | null;
  crf: number;
}

/** WhatsApp-friendly compression levels (H.264 + AAC in MP4). */
export const COMPRESSION_PRESETS: CompressionPreset[] = [
  { id: "light", label: "کیفیت بالا", hint: "کاهش کم حجم، مناسب آرشیو", height: 720, crf: 26 },
  { id: "balanced", label: "متعادل", hint: "پیشنهادی برای واتساپ و تلگرام", height: 480, crf: 30 },
  { id: "small", label: "کم‌حجم", hint: "کمترین حجم، کیفیت پایین‌تر", height: 360, crf: 34 },
];

export const RESOLUTIONS = [
  { id: "source", label: "اندازهٔ اصلی", height: null },
  { id: "1080", label: "۱۰۸۰p", height: 1080 },
  { id: "720", label: "۷۲۰p", height: 720 },
  { id: "480", label: "۴۸۰p", height: 480 },
  { id: "360", label: "۳۶۰p", height: 360 },
] as const;

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return (match?.[1] ?? "mp4").toLowerCase();
}

export function baseNameOf(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}\-_. ]/gu, "").trim() || "video";
}

/** «۱ دقیقه و ۲۳ ثانیه» */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  const digits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const fa = (value: number) => String(value).replace(/[0-9]/g, (d) => digits[Number(d)] ?? d);
  if (minutes === 0) return `${fa(rest)} ثانیه`;
  return `${fa(minutes)} دقیقه و ${fa(rest)} ثانیه`;
}
