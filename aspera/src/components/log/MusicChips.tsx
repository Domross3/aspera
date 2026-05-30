import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MusicGenre } from "../../types";
import { MUSIC_GENRE_OPTIONS } from "../../constants/options";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  selected: MusicGenre[];
  onChange: (genres: MusicGenre[]) => void;
}

export default function MusicChips({ selected, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState("");

  const toggle = (genre: MusicGenre) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (genre === "none") {
      onChange(["none"]);
      return;
    }
    const without = selected.filter((g) => g !== "none");
    const next = without.includes(genre)
      ? without.filter((g) => g !== genre)
      : [...without, genre];
    onChange(next.length === 0 ? ["none"] : next);
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed && !selected.includes(trimmed)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const without = selected.filter((g) => g !== "none");
      onChange([...without, trimmed]);
    }
    setCustomText("");
    setShowInput(false);
  };

  const presetTypes = MUSIC_GENRE_OPTIONS.map((o) => o.type as string);

  return (
    <View>
      <View style={styles.wrap}>
        {MUSIC_GENRE_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.type);
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(opt.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom genres the user added */}
        {selected
          .filter((g) => !presetTypes.includes(g))
          .map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, styles.chipSelected]}
              onPress={() => toggle(g)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>🎶</Text>
              <Text style={[styles.label, styles.labelSelected]}>{g}</Text>
            </TouchableOpacity>
          ))}

        {/* Add custom button */}
        <TouchableOpacity
          style={[styles.chip, styles.addChip]}
          onPress={() => setShowInput(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={colors.accent} />
          <Text style={[styles.label, { color: colors.accent }]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="e.g. Grunge, R&B, Synthwave..."
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
  wrap: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  chipSelected: {
    borderColor: c.accent,
    backgroundColor: c.accentGlow,
  },
  addChip: {
    borderColor: c.borderAccent,
    borderStyle: "dashed" as const,
  },
  emoji: { fontSize: 14 },
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
