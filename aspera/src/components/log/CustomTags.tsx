import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

const PRESET_TAGS = [
  { label: "Cold Shower", emoji: "🥶" },
  { label: "No Phone AM", emoji: "📵" },
  { label: "Sunlight", emoji: "☀️" },
  { label: "Alcohol", emoji: "🍺" },
  { label: "Poor Sleep", emoji: "😴" },
  { label: "Meditation", emoji: "🧘" },
  { label: "Journaling", emoji: "📓" },
  { label: "Social", emoji: "👥" },
];

const HIDDEN_TAGS_KEY = "aspera_hidden_tags";

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    editToggle: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      gap: 4,
      marginBottom: SPACING.sm,
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    editLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 12,
    } as object,
    wrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.accent,
      backgroundColor: c.accentGlow,
    },
    chipEditing: {
      borderStyle: "dashed",
    },
    chipHidden: {
      borderColor: c.border,
      borderStyle: "dashed",
      opacity: 0.6,
    },
    addChip: {
      borderColor: c.borderAccent,
      borderStyle: "dashed",
    },
    removeBtn: {
      marginRight: 2,
    },
    emoji: { fontSize: 13 },
    label: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
    } as object,
    labelActive: { color: c.accent },
    hiddenSection: {
      marginTop: SPACING.md,
    },
    hiddenHeading: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 11,
      marginBottom: SPACING.xs,
    } as object,
    inputRow: {
      flexDirection: "row",
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
      justifyContent: "center",
    },
  });

export default function CustomTags({ selected, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [editing, setEditing] = useState(false);
  const [hiddenTags, setHiddenTags] = useState<string[]>([]);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    AsyncStorage.getItem(HIDDEN_TAGS_KEY).then((raw) => {
      if (raw) setHiddenTags(JSON.parse(raw));
    });
  }, []);

  const persistHidden = async (next: string[]) => {
    setHiddenTags(next);
    await AsyncStorage.setItem(HIDDEN_TAGS_KEY, JSON.stringify(next));
  };

  const toggle = (tag: string) => {
    if (editing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    );
  };

  const hideTag = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    persistHidden([...hiddenTags, label]);
    // Also deselect if it was selected
    if (selected.includes(label)) {
      onChange(selected.filter((t) => t !== label));
    }
  };

  const restoreTag = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persistHidden(hiddenTags.filter((t) => t !== label));
  };

  const removeCustomTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(selected.filter((t) => t !== tag));
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed && !selected.includes(trimmed)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange([...selected, trimmed]);
    }
    setCustomText("");
    setShowInput(false);
  };

  const visiblePresets = PRESET_TAGS.filter(
    (t) => !hiddenTags.includes(t.label),
  );
  const customSelected = selected.filter(
    (t) => !PRESET_TAGS.some((p) => p.label === t),
  );

  return (
    <View>
      {/* Edit / Done toggle */}
      <TouchableOpacity
        style={styles.editToggle}
        onPress={() => setEditing(!editing)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={editing ? "checkmark-circle" : "create-outline"}
          size={16}
          color={editing ? colors.success : colors.textMuted}
        />
        <Text style={[styles.editLabel, editing && { color: colors.success }]}>
          {editing ? "Done" : "Edit"}
        </Text>
      </TouchableOpacity>

      <View style={styles.wrap}>
        {visiblePresets.map((t) => {
          const active = selected.includes(t.label);
          return (
            <TouchableOpacity
              key={t.label}
              style={[
                styles.chip,
                active && styles.chipActive,
                editing && styles.chipEditing,
              ]}
              onPress={() => toggle(t.label)}
              activeOpacity={0.7}
            >
              {editing && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => hideTag(t.label)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.emoji}>{t.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom tags the user has added */}
        {customSelected.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.chip,
              styles.chipActive,
              editing && styles.chipEditing,
            ]}
            onPress={() => toggle(t)}
            activeOpacity={0.7}
          >
            {editing && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeCustomTag(t)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={14} color={colors.danger} />
              </TouchableOpacity>
            )}
            <Text style={styles.emoji}>🏷️</Text>
            <Text style={[styles.label, styles.labelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}

        {/* Add custom tag button */}
        {!editing && (
          <TouchableOpacity
            style={[styles.chip, styles.addChip]}
            onPress={() => setShowInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={[styles.label, { color: colors.accent }]}>Custom</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restore hidden tags */}
      {editing && hiddenTags.length > 0 && (
        <View style={styles.hiddenSection}>
          <Text style={styles.hiddenHeading}>Hidden tags — tap to restore</Text>
          <View style={styles.wrap}>
            {hiddenTags.map((label) => {
              const preset = PRESET_TAGS.find((p) => p.label === label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, styles.chipHidden]}
                  onPress={() => restoreTag(label)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="add-circle"
                    size={14}
                    color={colors.success}
                  />
                  <Text style={styles.emoji}>{preset?.emoji ?? "🏷️"}</Text>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {showInput && !editing && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="Tag name..."
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
