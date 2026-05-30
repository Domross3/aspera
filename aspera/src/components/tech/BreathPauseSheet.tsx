// BreathPauseSheet — the gratification-delay pause for delay-mode restrictions.
//
// When the user wants to open a delay-shielded app, this presents a calm
// countdown: a breathing circle + a faint timer + a rotating reflective prompt.
// Pause-on-leave: the countdown only advances while Aspera is foregrounded
// (AppState); backgrounding pauses it (does not reset). On completion it calls
// onUnlock, whose parent lifts the shield for a short window via grantCheat.

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { Restriction } from "../../types";
import { clampDelaySeconds, pickPrompt } from "../../lib/gratificationDelay";
import BreathingOrb from "../common/BreathingOrb";
import PaperGrain from "../common/PaperGrain";
import { useFadeUp } from "../common/useFadeUp";

interface Props {
  visible: boolean;
  restriction: Restriction | null;
  onCancel: () => void;
  onUnlock: (restriction: Restriction) => Promise<void>;
}

const PROMPT_ROTATE_MS = 9000;

export default function BreathPauseSheet({
  visible,
  restriction,
  onCancel,
  onUnlock,
}: Props) {
  const totalSeconds =
    restriction && restriction.spec.kind === "delay"
      ? clampDelaySeconds(restriction.spec.delaySeconds)
      : 30;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [prompt, setPrompt] = useState(() => pickPrompt());
  const [unlocking, setUnlocking] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptStyle = useFadeUp(prompt);
  const appName = restriction?.name?.trim() || "the app";

  const clearTimers = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (promptRef.current) clearInterval(promptRef.current);
    tickRef.current = null;
    promptRef.current = null;
  };

  // Reset on open.
  useEffect(() => {
    if (!visible) return;
    setRemaining(totalSeconds);
    setPrompt(pickPrompt(Date.now()));
    setUnlocking(false);
  }, [visible, restriction?.id, totalSeconds]);

  // Countdown + prompt rotation + breath loop, paused while backgrounded.
  useEffect(() => {
    if (!visible) {
      clearTimers();
      return;
    }

    const startTimers = () => {
      if (tickRef.current) return;
      tickRef.current = setInterval(
        () => setRemaining((r) => Math.max(0, r - 1)),
        1000,
      );
      promptRef.current = setInterval(
        () => setPrompt(pickPrompt(Date.now())),
        PROMPT_ROTATE_MS,
      );
    };

    startTimers();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startTimers();
      } else {
        clearTimers(); // pause-on-leave: stop advancing, keep remaining
      }
    });

    return () => {
      clearTimers();
      sub.remove();
    };
  }, [visible, restriction?.id]);

  // Complete → unlock.
  useEffect(() => {
    if (!visible || remaining > 0 || unlocking || !restriction) return;
    setUnlocking(true);
    clearTimers();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void onUnlock(restriction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, visible]);

  const timer = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <PaperGrain />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>A pause · {appName}</Text>

          <View style={styles.orbRegion}>
            <BreathingOrb size={212}>
              <Text style={styles.orbWord}>Breathe</Text>
              <Text style={styles.orbTimer}>
                {unlocking ? "opening" : timer}
              </Text>
            </BreathingOrb>
          </View>

          <View style={styles.promptWrap}>
            <Animated.Text style={[styles.prompt, promptStyle]}>
              {prompt}
            </Animated.Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.84}
            onPress={onCancel}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>I&apos;m okay to wait</Text>
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={12}
            onPress={onCancel}
            style={styles.quiet}
          >
            <Text style={styles.quietText}>Open {appName}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 84,
    paddingBottom: 40,
  },
  body: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    maxWidth: 360,
  },
  eyebrow: {
    ...TYPOGRAPHY.aspLabel,
    color: COLORS.textMuted,
    letterSpacing: 1.54,
    marginBottom: 70,
  } as object,
  orbRegion: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbWord: {
    fontFamily: "Quicksand",
    fontSize: 22,
    fontWeight: "400",
    color: COLORS.text,
    opacity: 0.92,
  },
  orbTimer: {
    ...TYPOGRAPHY.mono,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  } as object,
  promptWrap: {
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  prompt: {
    ...TYPOGRAPHY.body,
    fontSize: 18,
    lineHeight: 27,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  } as object,
  primary: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: RADIUS.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    marginBottom: 14,
  },
  primaryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "500",
  } as object,
  quiet: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quietText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    letterSpacing: 0.48,
  } as object,
});
