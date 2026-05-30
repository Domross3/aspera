import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { WorkoutType } from "../../types";
import { WORKOUT_OPTIONS } from "../../constants/options";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  value: WorkoutType;
  onChange: (type: WorkoutType) => void;
}

export default function WorkoutSelector({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState("");

  const isCustom =
    value !== "none" && !WORKOUT_OPTIONS.some((o) => o.type === value);

  const handlePress = (type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(type);
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(trimmed);
    }
    setCustomText("");
    setShowInput(false);
  };

  return (
    <View>
      <View style={styles.grid}>
        {WORKOUT_OPTIONS.map((opt) => {
          const selected = value === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => handlePress(opt.type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={selected ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Show custom tile if custom value is active */}
        {isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.tileSelected]}
            onPress={() => handlePress("none")}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color={colors.accent} />
            <Text style={[styles.label, styles.labelSelected]}>{value}</Text>
          </TouchableOpacity>
        )}

        {/* Add custom button */}
        {!isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.addTile]}
            onPress={() => setShowInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={colors.accent} />
            <Text style={[styles.label, { color: colors.accent }]}>Custom</Text>
          </TouchableOpacity>
        )}
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="e.g. Swimming, Boxing..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: AsperaColors) => ({
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: SPACING.sm,
  },
  tile: {
    width: "30%" as const,
    alignItems: "center" as const,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    gap: 4,
  },
  tileSelected: {
    borderColor: c.accent,
    backgroundColor: c.accentGlow,
  },
  addTile: {
    borderColor: c.borderAccent,
    borderStyle: "dashed" as const,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
  } as object,
  labelSelected: {
    color: c.accent,
  },
  inputRow: {
    flexDirection: "row" as const,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: c.text,
    ...(TYPOGRAPHY.body as object),
  },
  addBtn: {
    backgroundColor: c.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: "center" as const,
  },
});
