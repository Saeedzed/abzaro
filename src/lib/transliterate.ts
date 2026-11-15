/**
 * Persian → Latin transliteration for postal addresses.
 *
 * Two layers:
 *   1. a dictionary of the words that actually appear in Iranian addresses
 *      (city and street names, postal vocabulary) — this is what makes the
 *      output usable on an envelope instead of "khıyabun";
 *   2. a fallback letter map so every remaining word still gets a Latin form.
 *
 * The result is *transliteration*, not translation: «خیابان ولیعصر» becomes
 * "Khiaban Valiasr", which is what international mail and forms expect.
 */

/** Whole-word dictionary. Keys are normalised (ی/ي, ک/ك, no ZWNJ). */
const WORDS: Record<string, string> = {
  // postal vocabulary
  خیابان: "Khiaban",
  خيابان: "Khiaban",
  بلوار: "Bolvar",
  کوچه: "Kucheh",
  كوچه: "Kucheh",
  بن‌بست: "Bonbast",
  میدان: "Meydan",
  ميدان: "Meydan",
  بزرگراه: "Bozorgrah",
  جاده: "Jadeh",
  راه: "Rah",
  پلاک: "Pelak",
  پلاك: "Pelak",
  واحد: "Vahed",
  طبقه: "Tabagheh",
  کدپستی: "Kodposti",
  کد: "Kod",
  پستی: "Posti",
  استان: "Ostan",
  شهرستان: "Shahrestan",
  شهر: "Shahr",
  روستای: "Rustaye",
  روستا: "Rusta",
  بخش: "Bakhsh",
  دهستان: "Dehestan",
  کوی: "Kuy",
  شهرک: "Shahrak",
  مجتمع: "Mojahed",
  ساختمان: "Sakhteman",
  برج: "Borj",
  جنب: "Janb",
  مقابل: "Moghabel",
  نبش: "Nabsh",
  انتهای: "Entehaye",
  ابتدای: "Ebtedaye",
  شمالی: "Shomali",
  جنوبی: "Jonubi",
  شرقی: "Sharghi",
  غربی: "Gharbi",
  مرکزی: "Markazi",
  اصلی: "Asli",
  فرعی: "Farei",
  جدید: "Jadid",
  قدیم: "Ghadim",
  بزرگ: "Bozorg",
  کوچک: "Kuchak",
  اول: "Avval",
  دوم: "Dovvom",
  سوم: "Sevvom",
  چهارم: "Chaharam",
  پنجم: "Panjom",
  // common city and street names
  تهران: "Tehran",
  مشهد: "Mashhad",
  اصفهان: "Isfahan",
  کرج: "Karaj",
  شیراز: "Shiraz",
  تبریز: "Tabriz",
  قم: "Qom",
  اهواز: "Ahvaz",
  کرمانشاه: "Kermanshah",
  ارومیه: "Urmia",
  رشت: "Rasht",
  زاهدان: "Zahedan",
  همدان: "Hamedan",
  کرمان: "Kerman",
  یزد: "Yazd",
  اردبیل: "Ardabil",
  بندرعباس: "Bandar Abbas",
  اراک: "Arak",
  قزوین: "Qazvin",
  ساری: "Sari",
  بوشهر: "Bushehr",
  گرگان: "Gorgan",
  خرم‌آباد: "Khorramabad",
  ولیعصر: "Valiasr",
  ولی‌عصر: "Valiasr",
  انقلاب: "Enghelab",
  آزادی: "Azadi",
  امام: "Emam",
  خمینی: "Khomeini",
  فردوسی: "Ferdowsi",
  حافظ: "Hafez",
  سعدی: "Saadi",
  مطهری: "Motahari",
  بهشتی: "Beheshti",
  کارگر: "Kargar",
  جمهوری: "Jomhuri",
  طالقانی: "Taleghani",
  شریعتی: "Shariati",
  میرداماد: "Mirdamad",
  پاسداران: "Pasdaran",
  صادقیه: "Sadeghieh",
  تجریش: "Tajrish",
  ونک: "Vanak",
  نیاوران: "Niavaran",
  الهیه: "Elahieh",
  سعادت‌آباد: "Saadat Abad",
  شهرک‌غرب: "Shahrak Gharb",
  اکباتان: "Ekbatan",
  پونک: "Punak",
  جنت‌آباد: "Jannat Abad",
  رسالت: "Resalat",
  تهرانپارس: "Tehranpars",
  افریقا: "Africa",
  آفریقا: "Africa",
  کردستان: "Kordestan",
  همت: "Hemmat",
  صدر: "Sadr",
  بابایی: "Babaei",
  لشگری: "Lashgari",
  نواب: "Navvab",
  تختي: "Takhti",
  تختی: "Takhti",
  وليعصر: "Valiasr",
};

/** Letter map for words that are not in the dictionary. */
const LETTERS: Array<[RegExp, string]> = [
  [/خ/g, "kh"], [/ش/g, "sh"], [/چ/g, "ch"], [/ژ/g, "zh"], [/ث/g, "s"],
  [/ص/g, "s"], [/ض/g, "z"], [/ط/g, "t"], [/ظ/g, "z"], [/ع/g, "a"],
  [/غ/g, "gh"], [/ق/g, "gh"], [/ح/g, "h"], [/ه/g, "h"], [/ک/g, "k"],
  [/گ/g, "g"], [/پ/g, "p"], [/ب/g, "b"], [/ت/g, "t"], [/د/g, "d"],
  [/ذ/g, "z"], [/ر/g, "r"], [/ز/g, "z"], [/س/g, "s"], [/ف/g, "f"],
  [/و/g, "v"], [/ل/g, "l"], [/م/g, "m"], [/ن/g, "n"], [/ی/g, "y"],
  [/ي/g, "y"], [/ا/g, "a"], [/آ/g, "a"], [/أ/g, "a"], [/إ/g, "e"],
  [/ؤ/g, "o"], [/ئ/g, "e"], [/ة/g, "h"], [/ء/g, ""], [/ى/g, "a"],
  [/ك/g, "k"],
];

const VOWELS = /[aoeyi]/;

export interface TransliterationResult {
  /** Full Latin address, words joined by single spaces. */
  latin: string;
  /** Per-word breakdown so the user can fix a word that came out wrong. */
  words: Array<{ source: string; latin: string; fromDictionary: boolean }>;
}

/** Normalise Persian orthography: unify ی/ک, drop ZWNJ, collapse spaces. */
export function normalisePersian(text: string): string {
  return text
    .replace(/\u200c/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u0652\u0654\u0655]/g, "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, " ")
    .trim();
}

function transliterateWord(word: string): string {
  // Whole-word match first, on the normalised form.
  const key = word.replace(/[،.,:;()«»"']/g, "");
  if (WORDS[key]) return WORDS[key]!;

  let out = "";
  for (const char of key) {
    if (/[0-9]/.test(char)) {
      out += char;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      out += char;
      continue;
    }
    const rule = LETTERS.find(([pattern]) => pattern.test(char));
    out += rule ? rule[1] : "";
  }
  // Collapse the vowel-less clusters Persian produces ("khiyabn" → "khiyaban"
  // would be a guess, so we only fix the obvious doubled letters).
  return out.replace(/(.)\1+/g, "$1").replace(/^[a-z]/, (c) => c.toUpperCase());
}

/** Transliterate a full Persian address. */
export function transliterateAddress(address: string): TransliterationResult {
  const normalised = normalisePersian(address);
  if (normalised === "") return { latin: "", words: [] };

  const parts = normalised.split(" ");
  const words = parts.map((source) => {
    const key = source.replace(/[،.,:;()«»"']/g, "");
    const fromDictionary = Boolean(WORDS[key]);
    return { source, latin: transliterateWord(source), fromDictionary };
  });

  return {
    latin: words.map((word) => word.latin).filter(Boolean).join(" "),
    words,
  };
}

export { VOWELS };
