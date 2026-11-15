/**
 * Arabic/Persian text shaping for PDF output.
 *
 * Why this exists: the Persian PDF tools must write real, joined Persian glyphs.
 * `@pdf-lib/fontkit` (1.x) ships an old HarfBuzz that picks *vertical*
 * presentation forms for final Persian letters — «رضایی» came out with a gap and
 * the wrong glyph — and fontkit 2 has the same defect. Rather than depend on it,
 * the joining is done here (it is a small, well-specified job) and the browser's
 * own shaper is used only as a cross-check in the tests.
 *
 * The algorithm is the standard Arabic joining model:
 *   1. normalise Persian letters (ی/ي, ک/ك) and drop harakat,
 *   2. for each letter, decide join-before / join-after from its joining type,
 *   3. map the resulting form (isolated / initial / medial / final) to the
 *      Unicode Arabic Presentation Form that every Persian font provides,
 *   4. apply the handful of Persian ligatures (لا، …) and reverse the line into
 *      visual order, keeping Latin/digit runs intact.
 */

/** Joining behaviour: D = dual joining, R = right (joins to the previous only), U = non-joining. */
const JOINING: Record<string, "D" | "R" | "U"> = {
  "\u0621": "U", // ء
  "\u0622": "R", // آ
  "\u0623": "R", // أ
  "\u0624": "R", // ؤ
  "\u0625": "R", // إ
  "\u0626": "D", // ئ
  "\u0627": "R", // ا
  "\u0628": "D", // ب
  "\u0629": "R", // ة
  "\u062A": "D", // ت
  "\u062B": "D", // ث
  "\u062C": "D", // ج
  "\u062D": "D", // ح
  "\u062E": "D", // خ
  "\u062F": "R", // د
  "\u0630": "R", // ذ
  "\u0631": "R", // ر
  "\u0632": "R", // ز
  "\u0633": "D", // س
  "\u0634": "D", // ش
  "\u0635": "D", // ص
  "\u0636": "D", // ض
  "\u0637": "D", // ط
  "\u0638": "D", // ظ
  "\u0639": "D", // ع
  "\u063A": "D", // غ
  "\u0640": "D", // ـ tatweel
  "\u0641": "D", // ف
  "\u0642": "D", // ق
  "\u0643": "D", // ك
  "\u0644": "D", // ل
  "\u0645": "D", // م
  "\u0646": "D", // ن
  "\u0647": "D", // ه
  "\u0648": "R", // و
  "\u0649": "R", // ى
  "\u064A": "D", // ي
  "\u0671": "R", // ٱ
  "\u067E": "D", // پ
  "\u0686": "D", // چ
  "\u0698": "R", // ژ
  "\u06A9": "D", // ک
  "\u06AF": "D", // گ
  "\u06C0": "R", // ۀ
  "\u06C1": "D", // ہ
  "\u06CC": "D", // ی
  "\u06D5": "R", // ە
};

/**
 * Presentation forms: [isolated, final, initial, medial].
 * A form that the letter does not have is left as null.
 */
const FORMS: Record<string, Array<number | null>> = {
  "\u0621": [0xfe80, null, null, null],
  "\u0622": [0xfe81, 0xfe82, null, null],
  "\u0623": [0xfe83, 0xfe84, null, null],
  "\u0624": [0xfe85, 0xfe86, null, null],
  "\u0625": [0xfe87, 0xfe88, null, null],
  "\u0626": [0xfe89, 0xfe8a, 0xfe8b, 0xfe8c],
  "\u0627": [0xfe8d, 0xfe8e, null, null],
  "\u0628": [0xfe8f, 0xfe90, 0xfe91, 0xfe92],
  "\u0629": [0xfe93, 0xfe94, null, null],
  "\u062a": [0xfe95, 0xfe96, 0xfe97, 0xfe98],
  "\u062b": [0xfe99, 0xfe9a, 0xfe9b, 0xfe9c],
  "\u062c": [0xfe9d, 0xfe9e, 0xfe9f, 0xfea0],
  "\u062d": [0xfea1, 0xfea2, 0xfea3, 0xfea4],
  "\u062e": [0xfea5, 0xfea6, 0xfea7, 0xfea8],
  "\u062f": [0xfea9, 0xfeaa, null, null],
  "\u0630": [0xfeab, 0xfeac, null, null],
  "\u0631": [0xfead, 0xfeae, null, null],
  "\u0632": [0xfeaf, 0xfeb0, null, null],
  "\u0633": [0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4],
  "\u0634": [0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8],
  "\u0635": [0xfeb9, 0xfeba, 0xfebb, 0xfebc],
  "\u0636": [0xfebd, 0xfebe, 0xfebf, 0xfec0],
  "\u0637": [0xfec1, 0xfec2, 0xfec3, 0xfec4],
  "\u0638": [0xfec5, 0xfec6, 0xfec7, 0xfec8],
  "\u0639": [0xfec9, 0xfeca, 0xfecb, 0xfecc],
  "\u063a": [0xfecd, 0xfece, 0xfecf, 0xfed0],
  "\u0641": [0xfed1, 0xfed2, 0xfed3, 0xfed4],
  "\u0642": [0xfed5, 0xfed6, 0xfed7, 0xfed8],
  "\u0643": [0xfed9, 0xfeda, 0xfedb, 0xfedc],
  "\u0644": [0xfedd, 0xfede, 0xfedf, 0xfee0],
  "\u0645": [0xfee1, 0xfee2, 0xfee3, 0xfee4],
  "\u0646": [0xfee5, 0xfee6, 0xfee7, 0xfee8],
  "\u0647": [0xfee9, 0xfeea, 0xfeeb, 0xfeec],
  "\u0648": [0xfeed, 0xfeee, null, null],
  "\u0649": [0xfeef, 0xfef0, null, null],
  "\u064a": [0xfef1, 0xfef2, 0xfef3, 0xfef4],
  "\u067e": [0xfb56, 0xfb57, 0xfb58, 0xfb59],
  "\u0686": [0xfb7a, 0xfb7b, 0xfb7c, 0xfb7d],
  "\u0698": [0xfb8a, 0xfb8b, null, null],
  "\u06a9": [0xfb8e, 0xfb8f, 0xfb90, 0xfb91],
  "\u06af": [0xfb92, 0xfb93, 0xfb94, 0xfb95],
  "\u06c0": [0xfba4, 0xfba5, null, null],
  "\u06cc": [0xfbfc, 0xfbfd, 0xfbfe, 0xfbff],
};

/** Lam-alef ligatures: [isolated, final]. */
const LIGATURES: Record<string, [number, number]> = {
  "\u0622": [0xfef5, 0xfef6],
  "\u0623": [0xfef7, 0xfef8],
  "\u0625": [0xfef9, 0xfefa],
  "\u0627": [0xfefb, 0xfefc],
};

const HARAKAT = /[\u064B-\u0652\u0670\u0653-\u0655\u0640]/g;
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_OR_DIGIT = /[0-9A-Za-z\u0660-\u0669\u06F0-\u06F9]/;

/** Persian orthography in one place: unify yeh/kaf, drop harakat. */
export function normaliseArabic(text: string): string {
  return text
    .replace(/\u064A/g, "\u06CC") // ي → ی
    .replace(/\u0643/g, "\u06A9") // ك → ک
    .replace(HARAKAT, "");
}

/**
 * Shape one run of Arabic text into presentation forms, in logical order.
 * Returns the shaped string; letters are joined where the script requires it.
 */
export function shapeArabic(text: string): string {
  const chars = [...normaliseArabic(text)];
  const out: string[] = [];

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index]!;
    const joining = JOINING[char];
    if (!joining) {
      out.push(char);
      continue;
    }

    // Can this letter join to the one before it? The previous letter must be
    // dual-joining and not separated by a space.
    const previous = chars[index - 1];
    const prevJoining = previous ? JOINING[previous] : undefined;
    const joinBefore = prevJoining === "D";

    // Can it join forward? Next letter must exist and accept a previous join.
    const next = chars[index + 1];
    const nextJoining = next ? JOINING[next] : undefined;
    const joinAfter =
      joining === "D" && nextJoining !== undefined && nextJoining !== "U";

    // Lam followed by an alef becomes a single ligature glyph.
    if (char === "\u0644" && next) {
      const ligature = LIGATURES[next];
      if (ligature) {
        out.push(String.fromCharCode(joinBefore ? ligature[1] : ligature[0]));
        index += 1; // consume the alef
        continue;
      }
    }

    const forms = FORMS[char];
    if (!forms) {
      out.push(char);
      continue;
    }
    const [isolated, final, initial, medial] = forms;
    const code =
      joinBefore && joinAfter
        ? medial
        : joinBefore
          ? final
          : joinAfter
            ? initial
            : isolated;
    out.push(String.fromCharCode(code ?? isolated ?? char.codePointAt(0)!));
  }

  return out.join("");
}

/**
 * Full preparation of a line for pdf-lib: shape the Arabic runs, then reverse
 * each right-to-left run into visual order. Latin and digit runs are kept in
 * reading order and placed at the correct end of the line.
 */
export function prepareLine(text: string): string {
  const shaped = shapeArabic(text);
  // Arabic *punctuation* (، ؛ ؟ ٪ …) is direction-neutral even though it lives in
  // the Arabic block: it must follow the text around it, not force an RTL run.
  const ARABIC_PUNCTUATION = /[\u060C\u061B\u061F\u066A-\u066D\u06D4]/;
  const isAr = (char: string) =>
    !ARABIC_PUNCTUATION.test(char) &&
    (ARABIC.test(char) || /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(char));

  // First pass: classify every character as RTL, LTR or neutral.
  const classes = [...shaped].map((char) =>
    isAr(char) ? "rtl" : LATIN_OR_DIGIT.test(char) ? "ltr" : "neutral",
  ) as Array<"rtl" | "ltr" | "neutral">;

  // Neutral characters (spaces, punctuation) take the direction of the text they
  // sit between — the rule a reader expects. If the two sides disagree (or there
  // is no neighbour), the paragraph direction wins, which is RTL here.
  for (let index = 0; index < classes.length; index += 1) {
    if (classes[index] !== "neutral") continue;
    let end = index;
    while (end + 1 < classes.length && classes[end + 1] === "neutral") end += 1;
    const before = classes[index - 1];
    const after = classes[end + 1];
    const resolved: "rtl" | "ltr" = before !== undefined && before === after && before !== "neutral" ? before : "rtl";
    for (let fill = index; fill <= end; fill += 1) classes[fill] = resolved;
    index = end;
  }

  const chars = [...shaped];
  type Run = { rtl: boolean; chars: string[] };
  const runs: Run[] = [];
  chars.forEach((char, index) => {
    const rtl = classes[index] !== "ltr";
    const last = runs.at(-1);
    if (last && last.rtl === rtl) last.chars.push(char);
    else runs.push({ rtl, chars: [char] });
  });

  if (!runs.some((run) => run.rtl)) return shaped;

  return runs
    .slice()
    .reverse()
    .map((run) => (run.rtl ? run.chars.slice().reverse().join("") : run.chars.join("")))
    .join("");
}

/**
 * Visual-order variant, used with an embedder that does no shaping of its own:
 * shape the letters, then order the runs into visual order.
 */
export function prepareVisualText(text: string): string {
  return fixDigitOrder(prepareLine(text));
}

/**
 * Persian/Arabic-Indic digit runs inside an RTL line come out reversed once the
 * line is flipped, so each run is reversed first to cancel that out ("۲۵۰,۰۰۰" →
 * "۰۰۰,۰۵۲" before the flip, correct after). ASCII digit runs are already handled
 * correctly by the run splitter, so they are left alone.
 */
const DIGIT_RUN =
  /[\u06F0-\u06F9\u0660-\u0669][\u06F0-\u06F9\u0660-\u0669.,:٫٬\-\/\\]*/g;

export function fixDigitOrder(text: string): string {
  return text.replace(DIGIT_RUN, (run, offset: number, whole: string) => {
    const beforeChar = whole.slice(0, offset).replace(/\s+$/, "").slice(-1);
    const afterChar = whole.slice(offset + run.length).replace(/^\s+/, "").slice(0, 1);
    if (/[A-Za-z]/.test(beforeChar) || /[A-Za-z]/.test(afterChar)) return run;
    return run.length > 1 ? [...run].reverse().join("") : run;
  });
}

/** Logical-order text, shaped — for callers that draw RTL themselves. */
export function preparePdfText(text: string): string {
  return fixDigitOrder(shapeArabic(text));
}
