// Evening Reflection — the second anchor of the Bookended Day.
//
// Renders at the top of the Log tab so the user closes the loop on what they
// set as today's focus before filling in the rest of their log.
//
// Relevance, not completion: we deliberately do NOT grade each focus
// done/partial/missed (that scoreboard was removed in the Log redesign). The
// focus is shown read-only as the thing to reflect against. The reflection is
// a one-line note plus — occasionally — a single eudaimonic depth tap
// (meaning / connection / growth), chosen by selectDepthPrompt. Some evenings
// show no depth prompt at all, by design.

import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import DepthTap from "./DepthTap";
import { DEPTH_PROMPTS } from "../../lib/depthPrompts";
import type { DepthPillar, DepthValue } from "../../types";

interface Props {
  bigRocks: string[];
  reflectionNote: string | undefined;
  // The single depth pillar to ask tonight, or null to ask none. Chosen by
  // selectDepthPrompt in the parent.
  depthPrompt: DepthPillar | null;
  depthValue: DepthValue | undefined;
  onChange: (next: {
    reflectionNote: string;
    depthPillar?: DepthPillar;
    depthValue?: DepthValue;
  }) => void;
}

export default function EveningReflection({
  bigRocks,
  reflectionNote,
  depthPrompt,
  depthValue,
  onChange,
}: Props) {
  const [localNote, setLocalNote] = useState(reflectionNote ?? "");

  useEffect(() => {
    if (reflectionNote !== undefined) setLocalNote(reflectionNote);
  }, [reflectionNote]);

  const updateNote = (text: string) => {
    setLocalNote(text);
    onChange({ reflectionNote: text });
  };

  const setDepth = (value: DepthValue) => {
    if (!depthPrompt) return;
    onChange({
      reflectionNote: localNote,
      depthPillar: depthPrompt,
      depthValue: value,
    });
  };

  const hasRocks = bigRocks.length > 0;

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <SectionLabel label="Wrap up today" style={{ marginTop: SPACING.sm }} />
      <GradientCard>
        {hasRocks ? (
          <>
            <Text style={styles.hint}>Today&apos;s focus</Text>
            {bigRocks.map((rock, i) => (
              <Text key={i} style={styles.rockText} numberOfLines={2}>
                {i + 1}. {rock}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.gentlePrompt}>
            Tomorrow, try naming one focus in the morning on the Today tab. It
            makes the wrap-up feel meaningful.
          </Text>
        )}

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

        {depthPrompt && (
          <DepthTap
            prompt={DEPTH_PROMPTS[depthPrompt]}
            value={depthValue}
            onChange={setDepth}
          />
        )}
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as object,
  gentlePrompt: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  } as object,
  rockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
