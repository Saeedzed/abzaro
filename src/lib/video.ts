/**
 * Browser video processing through ffmpeg.wasm.
 *
 * The core (~31 MB wasm) is served from /ffmpeg and only downloaded the first
 * time somebody actually converts a video — every other page stays light.
 * FFmpeg runs in a Web Worker inside the visitor's browser: no upload, no
 * server, no timeout. That is the whole reason this is possible without a
 * backend.
 */

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

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

/** Read duration and dimensions in the browser (fast, no ffmpeg needed). */
export async function inspectVideo(file: File): Promise<VideoInfo | VideoError> {
  const looksLikeVideo =
    (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type) ||
    /\.(mp4|mov|webm|mkv|avi|m4v|3gp|mpeg|mpg)$/i.test(file.name);

  if (!looksLikeVideo) {
    return { error: "فقط فایل‌های ویدیویی (MP4، MOV، WebM، MKV، AVI) پذیرفته می‌شوند." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "حجم فایل باید کمتر از ۲۰۰ مگابایت باشد." };
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.onloadedmetadata = () => {
          resolve({
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
        video.onerror = () => reject(new Error("metadata"));
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
const FFMPEG_WASM_URL = "/ffmpeg/ffmpeg-core.wasm";

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

/**
 * Load ffmpeg once and reuse it for every conversion in the session. The worker
 * and the 31 MB core are fetched from /ffmpeg (our own origin), so the site
 * needs no COOP/COEP headers and the wasm stays out of the JS bundle.
 */
export function loadFFmpeg(onLog?: (line: string) => void): Promise<LoadedFFmpeg> {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    if (typeof window === "undefined") throw new Error("client-only");
    const namespace = await loadFFmpegScript();
    const ffmpeg = new namespace.FFmpeg();

    if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));

    await ffmpeg.load({
      coreURL: FFMPEG_CORE_URL,
      wasmURL: FFMPEG_WASM_URL,
    });

    return { ffmpeg };
  })().catch((error: unknown) => {
    ffmpegPromise = null; // allow a retry on the next click
    throw error;
  });

  return ffmpegPromise;
}

export interface ConvertOptions {
  /** ffmpeg arguments; the input is always `input.<ext>` and output `output.<ext>`. */
  args: string[];
  inputName: string;
  outputName: string;
  onProgress?: (ratio: number) => void;
  onLog?: (line: string) => void;
}

export interface ConvertResult {
  blob: Blob;
  bytes: number;
  log: string;
}

/**
 * Run one ffmpeg pass over `file` and return the produced file.
 * Throws an `Error` with a Persian message when ffmpeg fails.
 */
export async function convertVideo(
  file: File,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const { ffmpeg } = await loadFFmpeg(options.onLog);
  const logLines: string[] = [];

  const logHandler = ({ message }: { message: string }) => {
    logLines.push(message);
    options.onLog?.(message);
  };
  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) {
      options.onProgress?.(Math.max(0, Math.min(1, progress)));
    }
  };

  ffmpeg.on("log", logHandler);
  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(options.inputName, new Uint8Array(await file.arrayBuffer()));
    await ffmpeg.exec([...options.args]);

    const data = await ffmpeg.readFile(options.outputName);
    // `readFile` returns Uint8Array for binary output (string only for text).
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    if (bytes.length === 0) {
      throw new Error("خروجی خالی بود؛ تنظیمات یا فایل ورودی را بررسی کنید.");
    }

    const blob = new Blob([new Uint8Array(bytes)], {
      type: outputMime(options.outputName),
    });

    // Free the worker's virtual FS so a 200 MB video does not linger in memory.
    await ffmpeg.deleteFile(options.inputName).catch(() => undefined);
    await ffmpeg.deleteFile(options.outputName).catch(() => undefined);

    return { blob, bytes: blob.size, log: logLines.join("\n") };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const log = logLines.join("\n");

    if (/does not contain any stream|Output file #0 does not contain/i.test(log)) {
      throw new Error(
        "این ویدیو صدای جدا ندارد؛ برای همین فایل صوتی ساخته نشد. ویدیویی با صدا انتخاب کنید.",
      );
    }
    if (/Invalid data found|moov atom not found|could not find codec parameters/i.test(log)) {
      throw new Error("فایل ویدیو خوانده نشد؛ ممکن است ناقص یا خراب باشد.");
    }
    if (/memory|allocate|RangeError/i.test(`${message}\n${log}`)) {
      throw new Error("حافظهٔ مرورگر برای این فایل کافی نبود؛ ویدیوی کوتاه‌تری امتحان کنید.");
    }
    throw new Error("پردازش ویدیو انجام نشد. قالب فایل یا تنظیمات را تغییر دهید.");
  } finally {
    ffmpeg.off("log", logHandler);
    ffmpeg.off("progress", progressHandler);
  }
}

function outputMime(name: string): string {
  if (name.endsWith(".mp3")) return "audio/mpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webm")) return "video/webm";
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
