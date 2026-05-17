// Text field — free-form input. `config.multiline` switches between a
// single-line and a 3-line box. Stored value can be any string; non-string
// inputs render as empty.

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: string) => void;
}

export default function TextField({ field, value, onChange }: Props) {
  const text = typeof value === "string" ? value : "";
  const multiline = field.config?.multiline ?? false;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{field.name}</Text>
      <TextInput
        value={text}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={multiline ? "Add a note…" : "…"}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, multiline && styles.inputMultiline]}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={multiline ? "default" : "done"}
        blurOnSubmit={!multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  } as object,
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    fontSize: 14,
  } as object,
  inputMultiline: {
    minHeight: 72,
  },
});
