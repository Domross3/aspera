// MomentCapture — bottom-sheet for capturing a Moment. Lives on the Mood
// tab alongside the existing Quick Capture, but takes free-form input
// rather than the mood/energy/stress sliders.
//
// Schema is minimal by design: a label (required), an optional duration
// chip, an optional note. Anything more structured belongs on the daily
// log as a recurrent EventTypeDef — Phase 7's promotion nudge surfaces
// the "want to track this for real?" path when a label recurs.

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import type { Moment } from "../../types";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSave: (moment: Moment) => void;
}

const DURATION_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 15, label: "15m" },
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
];

export default function MomentCapture({ visible, onCancel, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [note, setNote] = useState("");

  // Reset every time the sheet opens so consecutive captures don't carry
  // over stale text.
  useEffect(() => {
    if (visible) {
      setLabel("");
      setDuration(null);
      setNote("");
    }
  }, [visible]);

  const canSave = label.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = Date.now();
    onSave({
      id: new Date(now).toISOString(),
      timestamp: now,
      label: label.trim(),
      duration: duration ?? undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdropTouch}
            onPress={onCancel}
          />
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onCancel} hitSlop={8}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.titleText, { color: colors.text }]}>
                New moment
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.doneText,
                    { color: colors.accent },
                    !canSave && { color: colors.textMuted },
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="What happened?"
                placeholderTextColor={colors.textMuted}
                style={[styles.labelInput, { color: colors.text }]}
                autoFocus
                maxLength={80}
                returnKeyType="next"
              />

              <Text style={[styles.miniLabel, { color: colors.textMuted }]}>
                Duration (optional)
              </Text>
              <View style={styles.chipsRow}>
                {DURATION_PRESETS.map((preset) => {
                  const active = duration === preset.minutes;
                  return (
                    <TouchableOpacity
                      key={preset.minutes}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDuration(active ? null : preset.minutes);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        active && {
                          borderColor: colors.accent,
                          backgroundColor: colors.accentGlow,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.textSecondary },
                          active && { color: colors.text, fontWeight: "700" as const },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.miniLabel,
                  { color: colors.textMuted, marginTop: SPACING.lg },
                ]}
              >
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything else worth remembering?"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={300}
                style={[styles.noteInput, { color: colors.text }]}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    backdropTouch: { flex: 1 },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      paddingBottom: SPACING.xl,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    cancelText: {
      ...TYPOGRAPHY.body,
    } as object,
    titleText: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    doneText: {
      ...TYPOGRAPHY.body,
      fontWeight: "700",
    } as object,
    body: {
      padding: SPACING.lg,
    },
    labelInput: {
      ...TYPOGRAPHY.title,
      backgroundColor: c.surfaceElevated,
      borderColor: c.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      marginBottom: SPACING.lg,
    } as object,
    miniLabel: {
      ...TYPOGRAPHY.label,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: SPACING.sm,
    } as object,
    chipsRow: {
      flexDirection: "row",
      gap: SPACING.xs,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    chipText: {
      ...TYPOGRAPHY.body,
      fontSize: 13,
    } as object,
    noteInput: {
      ...TYPOGRAPHY.body,
      backgroundColor: c.surfaceElevated,
      borderColor: c.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      minHeight: 80,
      fontSize: 14,
    } as object,
  });
