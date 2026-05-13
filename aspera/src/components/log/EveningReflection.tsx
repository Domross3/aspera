// Evening Reflection — the second anchor of the Bookended Day.
//
// Renders at the top of the Log tab so the user closes the loop on what
// they committed to in the morning before they fill in the rest of their
// log. Three-button outcome per Big Rock (done/partial/missed) plus a
// one-line note that seeds tomorrow's briefing.
//
// Always visible in v1 (not time-gated). If there are no Big Rocks set
// for today, the component shows a gentle prompt without blocking.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { BigRockOutcome } from "../../types";

interface Props {
  bigRocks: string[];
  outcomes: BigRockOutcome[] | undefined;
  reflectionNote: string | undefined;
  onChange: (
    next: { outcomes: BigRockOutcome[]; reflectionNote: string },
  ) => void;
}

const OUTCOME_BUTTONS: {
  value: BigRockOutcome;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "done",
    label: "Done",
    color: COLORS.success,
    icon: "checkmark-circle",
  },
  {
    value: "partial",
    label: "Partial",
    color: COLORS.warning,
    icon: "ellipse-outline",
  },
  {
    value: "missed",
    label: "Missed",
    color: COLORS.textMuted,
    icon: "close-circle",
  },
];

export default function EveningReflection({
  bigRocks,
  outcomes,
  reflectionNote,
  onChange,
}: Props) {
  // Local mirror of the parent state so the inputs feel instant. We push
  // changes upward on every interaction so the parent's form state stays
  // in sync (and Save persists everything in one shot).
  const [localOutcomes, setLocalOutcomes] = useState<BigRockOutcome[]>(
    outcomes ?? bigRocks.map(() => "missed"),
  );
  const [localNote, setLocalNote] = useState(reflectionNote ?? "");

  // If parent re-hydrates from cloud, mirror those values in.
  useEffect(() => {
    if (outcomes) setLocalOutcomes(outcomes);
  }, [outcomes]);
  useEffect(() => {
    if (reflectionNote !== undefined) setLocalNote(reflectionNote);
  }, [reflectionNote]);

  const setOutcome = (index: number, value: BigRockOutcome) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...localOutcomes];
    // Pad in case outcomes was shorter than rocks
    while (next.length < bigRocks.length) next.push("missed");
    next[index] = value;
    setLocalOutcomes(next);
    onChange({ outcomes: next, reflectionNote: localNote });
  };

  const updateNote = (text: string) => {
    setLocalNote(text);
    onChange({ outcomes: localOutcomes, reflectionNote: text });
  };

  if (bigRocks.length === 0) {
    return (
      <View style={{ marginBottom: SPACING.lg }}>
        <SectionLabel
          label="Wrap up today"
          style={{ marginTop: SPACING.sm }}
        />
        <GradientCard>
          <Text style={styles.gentlePrompt}>
            Tomorrow, try setting one Big Rock in the morning on the Today tab.
            It makes the wrap-up feel meaningful.
          </Text>
        </GradientCard>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <SectionLabel
        label="Wrap up today"
        style={{ marginTop: SPACING.sm }}
      />
      <GradientCard>
        <Text style={styles.hint}>
          How did today's Big Rocks land? No judgement — honest data helps.
        </Text>

        {bigRocks.map((rock, i) => {
          const current = localOutcomes[i] ?? "missed";
          return (
            <View key={i} style={styles.rockBlock}>
              <Text style={styles.rockText} numberOfLines={2}>
                {i + 1}. {rock}
              </Text>
              <View style={styles.outcomeRow}>
                {OUTCOME_BUTTONS.map((btn) => {
                  const active = current === btn.value;
                  return (
                    <TouchableOpacity
                      key={btn.value}
                      onPress={() => setOutcome(i, btn.value)}
                      style={[
                        styles.outcomeBtn,
                        active && {
                          backgroundColor: btn.color,
                          borderColor: btn.color,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={btn.icon}
                        size={14}
                        color={active ? COLORS.background : btn.color}
                      />
                      <Text
                        style={[
                          styles.outcomeLabel,
                          active && { color: COLORS.background },
                        ]}
                      >
                        {btn.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.noteWrap}>
          <Text style={styles.noteLabel}>Anything for tomorrow? (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={localNote}
            onChangeText={updateNote}
            placeholder="e.g. start with the deck before email"
            placeholderTextColor={COLORS.textMuted}
            maxLength={140}
            multiline
          />
        </View>
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  } as object,
  gentlePrompt: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  } as object,
  rockBlock: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  } as object,
  outcomeRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  outcomeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  outcomeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  noteWrap: {
    marginTop: SPACING.md,
  },
  noteLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as object,
  noteInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    minHeight: 56,
    textAlignVertical: "top",
    ...TYPOGRAPHY.body,
  } as object,
});
