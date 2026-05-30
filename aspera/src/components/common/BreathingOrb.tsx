import React, { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/theme";
import { useReducedMotion } from "./useReducedMotion";

interface Props {
  size?: number;
  showRing?: boolean;
  animate?: boolean;
  style?: object;
}

export default function BreathingOrb({
  size = 212,
  showRing = false,
  animate = true,
  style,
  children,
}: PropsWithChildren<Props>) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate || reducedMotion) {
      progress.setValue(0.5);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 5500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 5500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, progress, reducedMotion]);

  const orbScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.74, 1.06, 0.74],
  });
  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.18, 0.6, 0.18],
  });
  const ringScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 1.12, 0.9],
  });
  const ringOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 0.85, 0.45],
  });

  const glowSize = size * 1.18;
  const ringSize = size * 1.1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.shell,
        { width: glowSize, height: glowSize },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            opacity: glowOpacity,
            transform: [{ scale: orbScale }],
          },
        ]}
      />
      {showRing ? (
        <Animated.View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.orbWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: orbScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.orbA, COLORS.orbB] as [string, string]}
          start={{ x: 0.28, y: 0.18 }}
          end={{ x: 0.82, y: 0.96 }}
          style={[styles.orb, { borderRadius: size / 2 }]}
        >
          <View style={styles.insetLight} />
          <View style={styles.insetShadow} />
          {children ? <View style={styles.content}>{children}</View> : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    backgroundColor: COLORS.glow,
  },
  ring: {
    position: "absolute",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.ring,
  },
  orbWrap: {
    overflow: "hidden",
  },
  orb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  insetLight: {
    position: "absolute",
    left: "16%",
    top: "8%",
    width: "62%",
    height: "36%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  insetShadow: {
    position: "absolute",
    left: "-8%",
    right: "-8%",
    bottom: "-18%",
    height: "52%",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
});
