import { CustomMetricDef, CustomMetricKind, CustomMetricValue } from "../types";

export interface CreateMetricInput {
  name: string;
  kind: CustomMetricKind;
  scale?: CustomMetricDef["scale"];
  chips?: CustomMetricDef["chips"];
  counter?: CustomMetricDef["counter"];
}

function genId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export function createMetricDef(input: CreateMetricInput): CustomMetricDef {
  const def: CustomMetricDef = {
    id: genId(),
    name: input.name.trim(),
    kind: input.kind,
    createdAt: Date.now(),
  };
  if (input.scale) def.scale = { ...input.scale };
  if (input.chips)
    def.chips = { ...input.chips, options: [...input.chips.options] };
  if (input.counter) def.counter = { ...input.counter };
  return def;
}

export function validateMetricInput(input: CreateMetricInput): {
  ok: boolean;
  error?: string;
} {
  if (!input.name || !input.name.trim()) {
    return { ok: false, error: "Name is required" };
  }
  if (input.kind === "scale") {
    if (!input.scale) return { ok: false, error: "Scale config required" };
    if (input.scale.min >= input.scale.max) {
      return { ok: false, error: "Scale min must be less than max" };
    }
  }
  if (input.kind === "chips") {
    if (!input.chips || input.chips.options.length === 0) {
      return { ok: false, error: "Chips need at least one option" };
    }
  }
  if (input.kind === "counter") {
    if (!input.counter || input.counter.step <= 0) {
      return { ok: false, error: "Counter step must be positive" };
    }
  }
  return { ok: true };
}

export function defaultValueFor(def: CustomMetricDef): CustomMetricValue {
  switch (def.kind) {
    case "scale": {
      const min = def.scale?.min ?? 1;
      const max = def.scale?.max ?? 10;
      return { id: def.id, kind: "scale", value: Math.floor((min + max) / 2) };
    }
    case "chips":
      return { id: def.id, kind: "chips", selected: [] };
    case "counter":
      return { id: def.id, kind: "counter", value: def.counter?.min ?? 0 };
    case "toggle":
      return { id: def.id, kind: "toggle", value: false };
  }
}

export function getValue(
  values: CustomMetricValue[],
  def: CustomMetricDef,
): CustomMetricValue {
  const existing = values.find((v) => v.id === def.id);
  if (existing && existing.kind === def.kind) return existing;
  return defaultValueFor(def);
}

export function setValue(
  values: CustomMetricValue[],
  next: CustomMetricValue,
): CustomMetricValue[] {
  const idx = values.findIndex((v) => v.id === next.id);
  if (idx === -1) return [...values, next];
  const copy = values.slice();
  copy[idx] = next;
  return copy;
}

export function removeValuesForDef(
  values: CustomMetricValue[],
  defId: string,
): CustomMetricValue[] {
  return values.filter((v) => v.id !== defId);
}

export function isValueValidForDef(
  value: CustomMetricValue,
  def: CustomMetricDef,
): boolean {
  if (value.kind !== def.kind) return false;
  switch (def.kind) {
    case "scale": {
      if (value.kind !== "scale") return false;
      const { min, max } = def.scale ?? { min: 1, max: 10 };
      return value.value >= min && value.value <= max;
    }
    case "chips": {
      if (value.kind !== "chips") return false;
      const opts = def.chips?.options ?? [];
      if (!value.selected.every((s) => opts.includes(s))) return false;
      if (!def.chips?.multi && value.selected.length > 1) return false;
      return true;
    }
    case "counter": {
      if (value.kind !== "counter") return false;
      const min = def.counter?.min ?? -Infinity;
      const max = def.counter?.max ?? Infinity;
      return value.value >= min && value.value <= max;
    }
    case "toggle":
      return value.kind === "toggle";
  }
}
