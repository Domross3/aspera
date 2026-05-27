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
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import type { Moment } from "../../types";

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
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.titleText}>New moment</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={8}
              >
                <Text
                  style={[styles.doneText, !canSave && styles.doneDisabled]}
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
                placeholderTextColor={COLORS.textMuted}
                style={styles.labelInput}
                autoFocus
                maxLength={80}
                returnKeyType="next"
              />

              <Text style={styles.miniLabel}>Duration (optional)</Text>
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
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.miniLabel, { marginTop: SPACING.lg }]}>
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything else worth remembering?"
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={300}
                style={styles.noteInput}
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
  titleText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  doneText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  doneDisabled: {
    color: COLORS.textMuted,
  },
  body: {
    padding: SPACING.lg,
  },
  labelInput: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  } as object,
  miniLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  chipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
  } as object,
  chipTextActive: {
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  noteInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 80,
    fontSize: 14,
  } as object,
});
