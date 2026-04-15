import {
  createMetricDef,
  validateMetricInput,
  defaultValueFor,
  getValue,
  setValue,
  removeValuesForDef,
  isValueValidForDef,
} from "../src/lib/customMetrics";
import { CustomMetricDef, CustomMetricValue } from "../src/types";

describe("createMetricDef", () => {
  it("produces a stable id, createdAt, and preserves config for a scale metric", () => {
    const def = createMetricDef({
      name: "Motivation",
      kind: "scale",
      scale: { min: 1, max: 10 },
    });
    expect(def.id).toEqual(expect.any(String));
    expect(def.id.length).toBeGreaterThan(0);
    expect(def.createdAt).toEqual(expect.any(Number));
    expect(def.name).toBe("Motivation");
    expect(def.kind).toBe("scale");
    expect(def.scale).toEqual({ min: 1, max: 10 });
  });

  it("trims whitespace from the name", () => {
    const def = createMetricDef({
      name: "  Creativity  ",
      kind: "scale",
      scale: { min: 1, max: 10 },
    });
    expect(def.name).toBe("Creativity");
  });

  it("assigns unique ids across consecutive creations", () => {
    const a = createMetricDef({
      name: "A",
      kind: "toggle",
    });
    const b = createMetricDef({
      name: "B",
      kind: "toggle",
    });
    expect(a.id).not.toEqual(b.id);
  });

  it("accepts a chips metric with options", () => {
    const def = createMetricDef({
      name: "Mood",
      kind: "chips",
      chips: { options: ["Low", "OK", "Great"], multi: false },
    });
    expect(def.chips).toEqual({
      options: ["Low", "OK", "Great"],
      multi: false,
    });
  });

  it("accepts a counter metric with unit and step", () => {
    const def = createMetricDef({
      name: "Water",
      kind: "counter",
      counter: { step: 1, unit: "glasses", min: 0, max: 20 },
    });
    expect(def.counter?.step).toBe(1);
    expect(def.counter?.unit).toBe("glasses");
  });
});

describe("validateMetricInput", () => {
  it("rejects empty names", () => {
    expect(validateMetricInput({ name: "", kind: "toggle" })).toEqual({
      ok: false,
      error: expect.any(String),
    });
    expect(validateMetricInput({ name: "   ", kind: "toggle" })).toEqual({
      ok: false,
      error: expect.any(String),
    });
  });

  it("rejects a scale with min >= max", () => {
    expect(
      validateMetricInput({
        name: "Bad",
        kind: "scale",
        scale: { min: 5, max: 5 },
      }).ok,
    ).toBe(false);
    expect(
      validateMetricInput({
        name: "Bad",
        kind: "scale",
        scale: { min: 10, max: 1 },
      }).ok,
    ).toBe(false);
  });

  it("rejects a chips metric with no options", () => {
    expect(
      validateMetricInput({
        name: "Empty",
        kind: "chips",
        chips: { options: [], multi: false },
      }).ok,
    ).toBe(false);
  });

  it("rejects a counter with step <= 0", () => {
    expect(
      validateMetricInput({
        name: "Zero",
        kind: "counter",
        counter: { step: 0 },
      }).ok,
    ).toBe(false);
  });

  it("accepts a well-formed scale input", () => {
    expect(
      validateMetricInput({
        name: "Good",
        kind: "scale",
        scale: { min: 1, max: 10 },
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a toggle input without extra config", () => {
    expect(validateMetricInput({ name: "On/Off", kind: "toggle" })).toEqual({
      ok: true,
    });
  });
});

describe("defaultValueFor", () => {
  const baseDef = (over: Partial<CustomMetricDef>): CustomMetricDef => ({
    id: "id-1",
    name: "x",
    kind: "toggle",
    createdAt: 0,
    ...over,
  });

  it("defaults scale to the midpoint, rounded down", () => {
    const v = defaultValueFor(
      baseDef({ kind: "scale", scale: { min: 1, max: 10 } }),
    );
    expect(v).toEqual({ id: "id-1", kind: "scale", value: 5 });
  });

  it("defaults chips to an empty selection", () => {
    const v = defaultValueFor(
      baseDef({
        kind: "chips",
        chips: { options: ["A", "B"], multi: true },
      }),
    );
    expect(v).toEqual({ id: "id-1", kind: "chips", selected: [] });
  });

  it("defaults counter to the configured min or 0", () => {
    expect(
      defaultValueFor(
        baseDef({ kind: "counter", counter: { step: 1, min: 5 } }),
      ),
    ).toEqual({ id: "id-1", kind: "counter", value: 5 });
    expect(
      defaultValueFor(baseDef({ kind: "counter", counter: { step: 1 } })),
    ).toEqual({ id: "id-1", kind: "counter", value: 0 });
  });

  it("defaults toggle to false", () => {
    expect(defaultValueFor(baseDef({ kind: "toggle" }))).toEqual({
      id: "id-1",
      kind: "toggle",
      value: false,
    });
  });
});

describe("getValue / setValue / removeValuesForDef", () => {
  const def: CustomMetricDef = {
    id: "def-1",
    name: "Motivation",
    kind: "scale",
    createdAt: 0,
    scale: { min: 1, max: 10 },
  };

  it("returns the default when no value is stored", () => {
    expect(getValue([], def)).toEqual({
      id: "def-1",
      kind: "scale",
      value: 5,
    });
  });

  it("returns the stored value when present", () => {
    const values: CustomMetricValue[] = [
      { id: "def-1", kind: "scale", value: 8 },
    ];
    expect(getValue(values, def)).toEqual({
      id: "def-1",
      kind: "scale",
      value: 8,
    });
  });

  it("inserts a new value when the id is not yet present", () => {
    const result = setValue([], { id: "def-1", kind: "scale", value: 7 });
    expect(result).toEqual([{ id: "def-1", kind: "scale", value: 7 }]);
  });

  it("replaces an existing value by id rather than duplicating", () => {
    const existing: CustomMetricValue[] = [
      { id: "def-1", kind: "scale", value: 3 },
      { id: "def-2", kind: "toggle", value: true },
    ];
    const result = setValue(existing, { id: "def-1", kind: "scale", value: 9 });
    expect(result).toHaveLength(2);
    expect(result.find((v) => v.id === "def-1")).toEqual({
      id: "def-1",
      kind: "scale",
      value: 9,
    });
    expect(result.find((v) => v.id === "def-2")).toEqual({
      id: "def-2",
      kind: "toggle",
      value: true,
    });
  });

  it("removes all values for a deleted def", () => {
    const values: CustomMetricValue[] = [
      { id: "def-1", kind: "scale", value: 7 },
      { id: "def-2", kind: "toggle", value: true },
    ];
    expect(removeValuesForDef(values, "def-1")).toEqual([
      { id: "def-2", kind: "toggle", value: true },
    ]);
  });
});

describe("isValueValidForDef", () => {
  it("accepts a scale value inside [min, max]", () => {
    const def: CustomMetricDef = {
      id: "d",
      name: "n",
      kind: "scale",
      createdAt: 0,
      scale: { min: 1, max: 10 },
    };
    expect(isValueValidForDef({ id: "d", kind: "scale", value: 5 }, def)).toBe(
      true,
    );
    expect(isValueValidForDef({ id: "d", kind: "scale", value: 11 }, def)).toBe(
      false,
    );
    expect(isValueValidForDef({ id: "d", kind: "scale", value: 0 }, def)).toBe(
      false,
    );
  });

  it("rejects a chips selection that references an unknown option", () => {
    const def: CustomMetricDef = {
      id: "d",
      name: "n",
      kind: "chips",
      createdAt: 0,
      chips: { options: ["A", "B"], multi: true },
    };
    expect(
      isValueValidForDef({ id: "d", kind: "chips", selected: ["A"] }, def),
    ).toBe(true);
    expect(
      isValueValidForDef({ id: "d", kind: "chips", selected: ["C"] }, def),
    ).toBe(false);
  });

  it("rejects multiple chips selections when multi=false", () => {
    const def: CustomMetricDef = {
      id: "d",
      name: "n",
      kind: "chips",
      createdAt: 0,
      chips: { options: ["A", "B"], multi: false },
    };
    expect(
      isValueValidForDef({ id: "d", kind: "chips", selected: ["A", "B"] }, def),
    ).toBe(false);
  });

  it("enforces counter min/max bounds", () => {
    const def: CustomMetricDef = {
      id: "d",
      name: "n",
      kind: "counter",
      createdAt: 0,
      counter: { step: 1, min: 0, max: 10 },
    };
    expect(
      isValueValidForDef({ id: "d", kind: "counter", value: 0 }, def),
    ).toBe(true);
    expect(
      isValueValidForDef({ id: "d", kind: "counter", value: -1 }, def),
    ).toBe(false);
    expect(
      isValueValidForDef({ id: "d", kind: "counter", value: 11 }, def),
    ).toBe(false);
  });

  it("rejects mismatched kinds", () => {
    const def: CustomMetricDef = {
      id: "d",
      name: "n",
      kind: "toggle",
      createdAt: 0,
    };
    expect(isValueValidForDef({ id: "d", kind: "scale", value: 5 }, def)).toBe(
      false,
    );
  });
});
