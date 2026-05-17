// Binary toggle field. Renders a label + switch row inline. Default value
// is `false` — caller passes whatever the user has stored, or undefined
// (treated as false). No config block.

import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: boolean) => void;
}

export default function ToggleField({ field, value, onChange }: Props) {
  const on = value === true;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{field.name}</Text>
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.accent }}
        thumbColor={COLORS.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
});
