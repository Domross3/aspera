import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  rocks: string[];
  onChange: (rocks: string[]) => void;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    hint: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      marginBottom: SPACING.md,
    } as object,
    rockRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    numberBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      ...TYPOGRAPHY.caption,
      color: c.text,
      fontWeight: "800",
      fontSize: 11,
    } as object,
    rockText: {
      ...TYPOGRAPHY.body,
      color: c.text,
      flex: 1,
    } as object,
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
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
      ...TYPOGRAPHY.body,
    } as object,
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonDisabled: {
      backgroundColor: c.surfaceElevated,
    },
    emptyHint: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontStyle: "italic",
      marginTop: SPACING.sm,
      lineHeight: 16,
    } as object,
  });

export default function BigRocksInput({ rocks, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const addRock = () => {
    const trimmed = draft.trim();
    if (!trimmed || rocks.length >= 3) return;
    onChange([...rocks, trimmed]);
    setDraft("");
  };

  const removeRock = (index: number) => {
    onChange(rocks.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text style={styles.hint}>
        What are the 1–3 most important things to accomplish today?
      </Text>

      {rocks.map((rock, i) => (
        <View key={i} style={styles.rockRow}>
          <View
            style={[styles.numberBadge, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.numberText}>{i + 1}</Text>
          </View>
          <Text style={styles.rockText} numberOfLines={2}>
            {rock}
          </Text>
          <TouchableOpacity
            onPress={() => removeRock(i)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}

      {rocks.length < 3 && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={
              rocks.length === 0
                ? "e.g. Finish hackathon MVP"
                : "Add another rock..."
            }
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={addRock}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={addRock}
            style={[
              styles.addButton,
              !draft.trim() && styles.addButtonDisabled,
            ]}
            disabled={!draft.trim()}
          >
            <Ionicons
              name="add"
              size={20}
              color={draft.trim() ? colors.text : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}

      {rocks.length === 0 && (
        <Text style={styles.emptyHint}>
          Research shows focusing on your top priorities ("Big Rocks") before
          smaller tasks leads to higher deep-work output.
        </Text>
      )}
    </View>
  );
}
