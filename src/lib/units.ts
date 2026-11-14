/**
 * Unit conversion for the everyday «چند متر است؟» questions.
 *
 * Every unit stores a factor relative to its base unit, so converting is a
 * single multiplication — no per-pair tables, no floating-point surprises
 * beyond ordinary binary representation. Temperature is the one exception and
 * gets explicit formulas. Pure functions: safe on the server and in tests.
 */

export type UnitGroupId =
  | "length"
  | "mass"
  | "temperature"
  | "area"
  | "volume"
  | "speed"
  | "data";

export interface Unit {
  id: string;
  /** Persian label shown in the dropdown. */
  label: string;
  /** Short symbol shown next to the value. */
  symbol: string;
  /** Multiplier to the group's base unit (ignored for temperature). */
  factor: number;
}

export interface UnitGroup {
  id: UnitGroupId;
  title: string;
  base: string;
  units: Unit[];
}

export const UNIT_GROUPS: UnitGroup[] = [
  {
    id: "length",
    title: "طول",
    base: "meter",
    units: [
      { id: "millimeter", label: "میلی‌متر", symbol: "mm", factor: 0.001 },
      { id: "centimeter", label: "سانتی‌متر", symbol: "cm", factor: 0.01 },
      { id: "meter", label: "متر", symbol: "m", factor: 1 },
      { id: "kilometer", label: "کیلومتر", symbol: "km", factor: 1000 },
      { id: "inch", label: "اینچ", symbol: "in", factor: 0.0254 },
      { id: "foot", label: "فوت", symbol: "ft", factor: 0.3048 },
      { id: "yard", label: "یارد", symbol: "yd", factor: 0.9144 },
      { id: "mile", label: "مایل", symbol: "mi", factor: 1609.344 },
    ],
  },
  {
    id: "mass",
    title: "وزن",
    base: "kilogram",
    units: [
      { id: "milligram", label: "میلی‌گرم", symbol: "mg", factor: 0.000001 },
      { id: "gram", label: "گرم", symbol: "g", factor: 0.001 },
      { id: "kilogram", label: "کیلوگرم", symbol: "kg", factor: 1 },
      { id: "ton", label: "تن", symbol: "t", factor: 1000 },
      { id: "pound", label: "پوند", symbol: "lb", factor: 0.45359237 },
      { id: "ounce", label: "اونس", symbol: "oz", factor: 0.028349523125 },
    ],
  },
  {
    id: "temperature",
    title: "دما",
    base: "celsius",
    units: [
      { id: "celsius", label: "سلسیوس", symbol: "°C", factor: 1 },
      { id: "fahrenheit", label: "فارنهایت", symbol: "°F", factor: 1 },
      { id: "kelvin", label: "کلوین", symbol: "K", factor: 1 },
    ],
  },
  {
    id: "area",
    title: "مساحت",
    base: "square-meter",
    units: [
      { id: "square-centimeter", label: "سانتی‌متر مربع", symbol: "cm²", factor: 0.0001 },
      { id: "square-meter", label: "متر مربع", symbol: "m²", factor: 1 },
      { id: "square-kilometer", label: "کیلومتر مربع", symbol: "km²", factor: 1_000_000 },
      { id: "hectare", label: "هکتار", symbol: "ha", factor: 10_000 },
      { id: "square-foot", label: "فوت مربع", symbol: "ft²", factor: 0.09290304 },
      { id: "square-inch", label: "اینچ مربع", symbol: "in²", factor: 0.00064516 },
    ],
  },
  {
    id: "volume",
    title: "حجم",
    base: "liter",
    units: [
      { id: "milliliter", label: "میلی‌لیتر", symbol: "ml", factor: 0.001 },
      { id: "liter", label: "لیتر", symbol: "l", factor: 1 },
      { id: "cubic-meter", label: "متر مکعب", symbol: "m³", factor: 1000 },
      { id: "cup", label: "پیمانه", symbol: "cup", factor: 0.2365882365 },
      { id: "gallon", label: "گالن (آمریکا)", symbol: "gal", factor: 3.785411784 },
    ],
  },
  {
    id: "speed",
    title: "سرعت",
    base: "kmh",
    units: [
      { id: "kmh", label: "کیلومتر بر ساعت", symbol: "km/h", factor: 1 },
      { id: "ms", label: "متر بر ثانیه", symbol: "m/s", factor: 3.6 },
      { id: "mph", label: "مایل بر ساعت", symbol: "mph", factor: 1.609344 },
      { id: "knot", label: "گره دریایی", symbol: "kn", factor: 1.852 },
    ],
  },
  {
    id: "data",
    title: "حجم داده",
    base: "megabyte",
    units: [
      { id: "byte", label: "بایت", symbol: "B", factor: 1 / 1_048_576 },
      { id: "kilobyte", label: "کیلوبایت", symbol: "KB", factor: 1 / 1024 },
      { id: "megabyte", label: "مگابایت", symbol: "MB", factor: 1 },
      { id: "gigabyte", label: "گیگابایت", symbol: "GB", factor: 1024 },
      { id: "terabyte", label: "ترابایت", symbol: "TB", factor: 1_048_576 },
    ],
  },
];

export function getUnitGroup(id: UnitGroupId): UnitGroup {
  const group = UNIT_GROUPS.find((item) => item.id === id);
  if (!group) throw new Error(`Unknown unit group: ${id}`);
  return group;
}

/* -------------------------------------------------------------------------- */
/*  Temperature helpers                                                       */
/* -------------------------------------------------------------------------- */

function temperatureToCelsius(value: number, unitId: string): number {
  switch (unitId) {
    case "fahrenheit":
      return ((value - 32) * 5) / 9;
    case "kelvin":
      return value - 273.15;
    default:
      return value;
  }
}

function celsiusToTemperature(celsius: number, unitId: string): number {
  switch (unitId) {
    case "fahrenheit":
      return (celsius * 9) / 5 + 32;
    case "kelvin":
      return celsius + 273.15;
    default:
      return celsius;
  }
}

/**
 * Convert `value` from one unit of a group to another.
 * Returns `{ ok: false }` for unknown units or a non-finite input.
 */
export function convertUnit(
  value: number,
  fromId: string,
  toId: string,
  groupId: UnitGroupId,
): { ok: true; value: number } | { ok: false; error: string } {
  if (!Number.isFinite(value)) {
    return { ok: false, error: "عدد معتبری وارد کنید." };
  }
  const group = getUnitGroup(groupId);
  const from = group.units.find((unit) => unit.id === fromId);
  const to = group.units.find((unit) => unit.id === toId);
  if (!from || !to) {
    return { ok: false, error: "واحد انتخاب‌شده معتبر نیست." };
  }

  if (groupId === "temperature") {
    const celsius = temperatureToCelsius(value, from.id);
    return { ok: true, value: celsiusToTemperature(celsius, to.id) };
  }

  return { ok: true, value: (value * from.factor) / to.factor };
}

/** Format a converted value for display: trims noise, keeps big numbers sane. */
export function formatUnitValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.0001 || abs >= 1e12)) {
    return value.toExponential(4);
  }
  const rounded = Number(value.toPrecision(12));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: abs < 1 ? 8 : 6,
    useGrouping: true,
  }).format(rounded);
}
