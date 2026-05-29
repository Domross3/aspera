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
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { Restriction } from "../../types";
import { clampDelaySeconds, pickPrompt } from "../../lib/gratificationDelay";

interface Props {
  visible: boolean;
  restriction: Restriction | null;
  onCancel: () => void;
  onUnlock: (restriction: Restriction) => Promise<void>;
}

const PROMPT_ROTATE_MS = 6000;

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
  const breath = useRef(new Animated.Value(0)).current;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathLoop = useRef<Animated.CompositeAnimation | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, restriction?.id]);

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

    breathLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    breathLoop.current.start();
    startTimers();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startTimers();
        breathLoop.current?.start();
      } else {
        clearTimers(); // pause-on-leave: stop advancing, keep remaining
        breathLoop.current?.stop();
      }
    });

    return () => {
      clearTimers();
      breathLoop.current?.stop();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1.18],
  });
  const circleOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.body}>
          <Animated.View
            style={[
              styles.circle,
              { transform: [{ scale }], opacity: circleOpacity },
            ]}
          />
          <Text style={styles.prompt}>{prompt}</Text>
          <Text style={styles.timer}>
            {unlocking ? "Opening…" : `${remaining}s`}
          </Text>
          <TouchableOpacity
            hitSlop={12}
            onPress={onCancel}
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>Not now</Text>
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
    justifyContent: "center",
    padding: SPACING.xl,
  },
  body: { alignItems: "center", gap: SPACING.lg, maxWidth: 360 },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.accent,
    marginBottom: SPACING.md,
  },
  prompt: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 30,
  } as object,
  timer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  cancel: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
});
