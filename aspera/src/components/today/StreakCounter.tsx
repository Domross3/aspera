import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOWS,
} from "../../constants/theme";
import { MAX_RESERVES_PER_WEEK } from "../../types";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  streak: number;
  reservesRemaining: number;
}

export default function StreakCounter({ streak, reservesRemaining }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [streak]);

  const reserveTokens = [];
  for (let i = 0; i < MAX_RESERVES_PER_WEEK; i++) {
    const isAvailable = i < reservesRemaining;
    reserveTokens.push(
      <View
        key={i}
        style={[
          styles.token,
          isAvailable ? styles.tokenAvailable : styles.tokenSpent,
        ]}
      >
        <Text style={styles.tokenIcon}>{isAvailable ? "🛡️" : "🔲"}</Text>
      </View>,
    );
  }

  return (
    <LinearGradient
      colors={colors.gradients.energy as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, SHADOWS.glow]}
    >
      <Animated.Text
        style={[styles.flame, { transform: [{ scale: scaleAnim }] }]}
      >
        🔥
      </Animated.Text>
      <View style={styles.text}>
        <Text style={styles.label}>STREAK</Text>
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.unit}>{streak === 1 ? "day" : "days"}</Text>
      </View>
      <View style={styles.reserveColumn}>
        <Text style={styles.reserveLabel}>{reservesRemaining} remaining</Text>
        <View style={styles.tokenRow}>{reserveTokens}</View>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    card: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    flame: { fontSize: 40 },
    text: { flex: 1, gap: 2 },
    label: {
      ...TYPOGRAPHY.label,
      color: "rgba(255,255,255,0.7)",
    } as object,
    count: {
      ...TYPOGRAPHY.hero,
      color: c.text,
    } as object,
    unit: {
      ...TYPOGRAPHY.caption,
      color: "rgba(255,255,255,0.7)",
    } as object,
    reserveColumn: {
      alignItems: "center",
      gap: SPACING.xs,
    },
    reserveLabel: {
      ...TYPOGRAPHY.label,
      color: "rgba(255,255,255,0.5)",
      fontSize: 8,
    } as object,
    tokenRow: {
      flexDirection: "row",
      gap: SPACING.xs,
    },
    token: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    tokenAvailable: {
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    tokenSpent: {
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    tokenIcon: {
      fontSize: 14,
    },
  });
