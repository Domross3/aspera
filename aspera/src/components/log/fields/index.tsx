// Field renderer dispatcher. Takes a FieldDef and the current value out
// of an EventEntry's `fieldValues` map, and forwards to the right widget.
// New `kind` values get added here as a single switch case.

import React from "react";
import type { FieldDef } from "../../../types";
import ToggleField from "./ToggleField";
import ScaleField from "./ScaleField";
import ChipsField from "./ChipsField";
import CounterField from "./CounterField";
import TextField from "./TextField";
import DurationField from "./DurationField";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}

export default function FieldRenderer({ field, value, onChange }: Props) {
  switch (field.kind) {
    case "toggle":
      return <ToggleField field={field} value={value} onChange={onChange} />;
    case "scale":
      return <ScaleField field={field} value={value} onChange={onChange} />;
    case "chips":
      return <ChipsField field={field} value={value} onChange={onChange} />;
    case "counter":
      return <CounterField field={field} value={value} onChange={onChange} />;
    case "text":
      return <TextField field={field} value={value} onChange={onChange} />;
    case "duration":
      return (
        <DurationField field={field} value={value} onChange={onChange} />
      );
    default:
      // Unknown kind — likely a future schema landing on an older client.
      // Render nothing rather than crashing.
      return null;
  }
}

// Default value the editor seeds for a freshly-created entry. Used both
// for "Add entry" on recurrent types and the implicit first entry of a
// single type when the user starts touching its fields.
export function defaultValueFor(field: FieldDef): unknown {
  switch (field.kind) {
    case "toggle":
      return false;
    case "scale": {
      const min = field.config?.min ?? 1;
      const max = field.config?.max ?? 10;
      return Math.round((min + max) / 2);
    }
    case "chips":
      return [];
    case "counter":
      return field.config?.min ?? 0;
    case "text":
      return "";
    case "duration":
      return field.config?.min ?? 0;
    default:
      return null;
  }
}
