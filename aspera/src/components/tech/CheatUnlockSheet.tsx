import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { CheatPolicy, Restriction } from "../../types";
import {
  createCheatChallenge,
  normalizeCheatPolicy,
  spendCheat,
  verifyCheatCode,
  type CheatChallenge,
} from "../../lib/cheats";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  visible: boolean;
  restriction: Restriction | null;
  policy: CheatPolicy | undefined;
  onCancel: () => void;
  onUnlock: (
    restriction: Restriction,
    nextPolicy: CheatPolicy,
  ) => Promise<void>;
}

export default function CheatUnlockSheet({
  visible,
  restriction,
  policy,
  onCancel,
  onUnlock,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [challenge, setChallenge] = useState<CheatChallenge | null>(null);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!visible) {
      setChallenge(null);
      setInput("");
      setSubmitting(false);
      setError(null);
      setUnlocked(false);
    }
  }, [visible]);

  const normalizedPolicy = useMemo(
    () => normalizeCheatPolicy(policy),
    [policy, visible],
  );
  const remaining = Math.max(
    0,
    normalizedPolicy.weeklyCap - normalizedPolicy.spentThisWeek,
  );

  const beginChallenge = () => {
    if (!restriction || remaining <= 0) {
      setError("No cheats remain this week.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChallenge(createCheatChallenge(restriction.id));
    setInput("");
    setError(null);
  };

  const copyCode = async () => {
    if (!challenge) return;
    await Clipboard.setStringAsync(challenge.code);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const submit = async () => {
    if (!restriction || !challenge || submitting) return;
    if (!verifyCheatCode(challenge, input)) {
      setError("Paste the exact fresh code to unlock.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const spend = spendCheat(normalizedPolicy);
    if (!spend.allowed) {
      setError("No cheats remain this week.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onUnlock(restriction, spend.policy);
      setUnlocked(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
    } finally {
      setSubmitting(false);
    }
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
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropTouch}
          onPress={onCancel}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Use a cheat
            </Text>
            <TouchableOpacity hitSlop={10} onPress={onCancel}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.body, { color: colors.textMuted }]}>
            Open Aspera to use a cheat. Apple's default shield cannot show this
            unlock flow inside the blocked app.
          </Text>

          {restriction ? (
            <View style={styles.limitBox}>
              <Text style={[styles.limitLabel, { color: colors.textMuted }]}>
                Restriction
              </Text>
              <Text style={[styles.limitName, { color: colors.text }]}>
                {restriction.name}
              </Text>
            </View>
          ) : null}

          {unlocked ? (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.success}
              />
              <Text style={[styles.successText, { color: colors.success }]}>
                Unlocked for 30 minutes. Aspera will re-arm it if the limit
                still applies.
              </Text>
            </View>
          ) : challenge ? (
            <View>
              <Text style={[styles.body, { color: colors.textMuted }]}>
                Copy this code, then paste it below exactly. This is the
                deliberate pause before the shield lifts.
              </Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => void copyCode()}
                style={styles.codeBox}
              >
                <Text selectable style={[styles.codeText, { color: colors.text }]}>
                  {challenge.code}
                </Text>
                <Ionicons name="copy-outline" size={18} color={colors.accent} />
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Paste code here"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[styles.input, { color: colors.text }]}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void submit()}
                disabled={submitting}
                style={[styles.primaryButton, submitting && styles.disabled]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.text }]}>
                    Unlock 30 minutes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={[styles.body, { color: colors.textMuted }]}>
                This will spend 1 of {normalizedPolicy.weeklyCap} cheats this
                week. Remaining: {remaining}.
              </Text>
              {error ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={beginChallenge}
                disabled={remaining <= 0}
                style={[
                  styles.primaryButton,
                  remaining <= 0 && styles.disabled,
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.text }]}>
                  Confirm and reveal code
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      justifyContent: "flex-end",
    },
    backdropTouch: { flex: 1 },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    title: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    body: {
      ...TYPOGRAPHY.caption,
      lineHeight: 18,
      marginBottom: SPACING.md,
    } as object,
    limitBox: {
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },
    limitLabel: {
      ...TYPOGRAPHY.label,
      marginBottom: 2,
    } as object,
    limitName: {
      ...TYPOGRAPHY.body,
      fontWeight: "800",
    } as object,
    codeBox: {
      borderRadius: RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderAccent,
      backgroundColor: "rgba(108,99,255,0.12)",
      padding: SPACING.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    codeText: {
      ...TYPOGRAPHY.body,
      fontWeight: "900",
      letterSpacing: 0,
    } as object,
    input: {
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      ...TYPOGRAPHY.body,
    } as object,
    primaryButton: {
      minHeight: 48,
      borderRadius: RADIUS.lg,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: SPACING.md,
    },
    primaryButtonText: {
      ...TYPOGRAPHY.body,
      fontWeight: "800",
    } as object,
    disabled: { opacity: 0.55 },
    errorText: {
      ...TYPOGRAPHY.caption,
      marginTop: SPACING.sm,
    } as object,
    successBox: {
      borderRadius: RADIUS.lg,
      backgroundColor: "rgba(34,197,94,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(34,197,94,0.35)",
      padding: SPACING.md,
      flexDirection: "row",
      gap: SPACING.sm,
    },
    successText: {
      ...TYPOGRAPHY.caption,
      flex: 1,
      lineHeight: 18,
    } as object,
  });
