import { test } from "node:test";
import assert from "node:assert/strict";
import { UNIT_GROUPS, convertUnit, formatUnitValue, getUnitGroup } from "./units";

test("unit groups all expose a base unit and non-empty unit lists", () => {
  for (const group of UNIT_GROUPS) {
    assert.ok(group.units.length >= 2, `${group.id} needs at least two units`);
    assert.ok(
      group.units.some((unit) => unit.id === group.base),
      `${group.id} base unit must exist in its unit list`,
    );
  }
});

test("length: 100 cm = 1 m and 1 in = 2.54 cm", () => {
  const meters = convertUnit(100, "centimeter", "meter", "length");
  assert.equal(meters.ok && Math.round(meters.value * 1000) / 1000, 1);
  const inches = convertUnit(1, "inch", "centimeter", "length");
  assert.equal(inches.ok && Math.round(inches.value * 100) / 100, 2.54);
});

test("mass: 1 pound = 0.45359237 kg", () => {
  const result = convertUnit(1, "pound", "kilogram", "mass");
  assert.equal(result.ok && Number(result.value.toFixed(8)), 0.45359237);
});

test("temperature uses formulas, not factors", () => {
  const freezing = convertUnit(0, "celsius", "fahrenheit", "temperature");
  assert.equal(freezing.ok && freezing.value, 32);
  const boiling = convertUnit(100, "celsius", "fahrenheit", "temperature");
  assert.equal(boiling.ok && boiling.value, 212);
  const absoluteZero = convertUnit(-273.15, "celsius", "kelvin", "temperature");
  assert.equal(absoluteZero.ok && Math.round(absoluteZero.value), 0);
  const back = convertUnit(212, "fahrenheit", "celsius", "temperature");
  assert.equal(back.ok && Math.round(back.value), 100);
});

test("data: 1 GB = 1024 MB (binary conventions)", () => {
  const result = convertUnit(1, "gigabyte", "megabyte", "data");
  assert.equal(result.ok && result.value, 1024);
});

test("speed: 1 m/s = 3.6 km/h", () => {
  const result = convertUnit(1, "ms", "kmh", "speed");
  assert.equal(result.ok && Math.round(result.value * 10) / 10, 3.6);
});

test("unknown units and non-finite values return a Persian error", () => {
  const unknown = convertUnit(1, "nope", "meter", "length");
  assert.equal(unknown.ok, false);
  assert.match(unknown.ok === false ? unknown.error : "", /معتبر/);

  const nan = convertUnit(Number.NaN, "meter", "kilometer", "length");
  assert.equal(nan.ok, false);
});

test("getUnitGroup throws for an unknown group", () => {
  assert.throws(() => getUnitGroup("nope" as never));
});

test("formatUnitValue keeps useful precision and trims noise", () => {
  assert.equal(formatUnitValue(1), "1");
  assert.equal(formatUnitValue(2.54), "2.54");
  assert.equal(formatUnitValue(0.0001), "0.0001");
  assert.equal(formatUnitValue(1234567.891), "1,234,567.891");
  assert.equal(formatUnitValue(Number.POSITIVE_INFINITY), "—");
});
