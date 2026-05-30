import React, { useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { aspMoodWord, MoodPadPoint } from "../../lib/moodPad";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  initialPoint?: MoodPadPoint;
  saving?: boolean;
  onSave: (point: MoodPadPoint) => void | Promise<void>;
}

const DEFAULT_POINT = { x: 0.62, y: 0.34 };
const PAD_SIZE = 290;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export default function MoodPad({
  initialPoint = DEFAULT_POINT,
  saving = false,
  onSave,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [point, setPoint] = useState(initialPoint);
  const [active, setActive] = useState(false);
  const [layout, setLayout] = useState({ width: PAD_SIZE, height: PAD_SIZE });
  const word = aspMoodWord(point.x, point.y);
  const lightness = 12 + point.y * 12 + point.x * 4;

  const updateFromLocation = (locationX: number, locationY: number) => {
    setPoint({
      x: clamp(locationX / layout.width),
      y: clamp(1 - locationY / layout.height),
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setActive(true);
        updateFromLocation(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      },
      onPanResponderMove: (event) => {
        updateFromLocation(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      },
      onPanResponderRelease: () => setActive(false),
      onPanResponderTerminate: () => setActive(false),
    }),
  ).current;

  const padBackground = useMemo(
    () => [
      `hsl(42, 5%, ${Math.min(56, lightness + 16)}%)`,
      `hsl(40, 4%, ${lightness}%)`,
    ],
    [lightness],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  return (
    <View style={styles.shell}>
      <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
        How are you, really?
      </Text>
      <View
        onLayout={onLayout}
        style={[styles.pad, { borderColor: colors.border }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={padBackground as [string, string]}
          start={{ x: point.x, y: 1 - point.y }}
          end={{ x: 1 - point.x * 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.verticalCross, { backgroundColor: colors.line }]} />
        <View
          style={[styles.horizontalCross, { backgroundColor: colors.line }]}
        />
        <Text style={[styles.poleLabel, styles.topLabel, { color: colors.textMuted }]}>
          energized
        </Text>
        <Text style={[styles.poleLabel, styles.bottomLabel, { color: colors.textMuted }]}>
          at rest
        </Text>
        <Text style={[styles.poleLabel, styles.leftLabel, { color: colors.textMuted }]}>
          low
        </Text>
        <Text style={[styles.poleLabel, styles.rightLabel, { color: colors.textMuted }]}>
          good
        </Text>
        <View
          style={[
            styles.orb,
            active && styles.orbActive,
            {
              left: `${point.x * 100}%`,
              top: `${(1 - point.y) * 100}%`,
              shadowColor: colors.glow,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.orbA, colors.orbB] as [string, string]}
            start={{ x: 0.3, y: 0.15 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.orbGradient}
          />
        </View>
      </View>
      <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Drag to where you are
      </Text>
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={() => void onSave(point)}
        disabled={saving}
        style={[
          styles.saveButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
          saving && { opacity: 0.55 },
        ]}
      >
        <Text style={[styles.saveText, { color: colors.text }]}>
          {saving ? "Saving..." : "Save how I feel"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (_c: AsperaColors) =>
  StyleSheet.create({
    shell: {
      alignItems: "center",
      paddingVertical: SPACING.lg,
    },
    eyebrow: {
      ...TYPOGRAPHY.aspLabel,
      alignSelf: "flex-start",
      marginBottom: 30,
    } as object,
    pad: {
      width: PAD_SIZE,
      height: PAD_SIZE,
      maxWidth: "100%",
      borderRadius: RADIUS.moodSquare,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: "hidden",
    },
    verticalCross: {
      position: "absolute",
      top: 22,
      bottom: 22,
      left: "50%",
      width: StyleSheet.hairlineWidth,
    },
    horizontalCross: {
      position: "absolute",
      left: 22,
      right: 22,
      top: "50%",
      height: StyleSheet.hairlineWidth,
    },
    poleLabel: {
      ...TYPOGRAPHY.aspLabel,
      position: "absolute",
      fontSize: 9.5,
    } as object,
    topLabel: { top: 14, alignSelf: "center" },
    bottomLabel: { bottom: 14, alignSelf: "center" },
    leftLabel: { left: 16, top: "48%" },
    rightLabel: { right: 16, top: "48%" },
    orb: {
      position: "absolute",
      width: 42,
      height: 42,
      borderRadius: 21,
      transform: [{ translateX: -21 }, { translateY: -21 }],
      shadowOpacity: 0.4,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 },
      overflow: "hidden",
    },
    orbActive: {
      width: 48,
      height: 48,
      borderRadius: 24,
      transform: [{ translateX: -24 }, { translateY: -24 }],
      shadowRadius: 32,
    },
    orbGradient: {
      flex: 1,
      borderRadius: 999,
    },
    word: {
      fontFamily: "QuicksandMedium",
      fontSize: 30,
      marginTop: 28,
    },
    hint: {
      ...TYPOGRAPHY.body,
      marginTop: 6,
    } as object,
    saveButton: {
      width: "100%",
      maxWidth: 260,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.soft,
      borderWidth: StyleSheet.hairlineWidth,
      paddingVertical: 15,
      paddingHorizontal: 30,
      marginTop: SPACING.xl,
    },
    saveText: {
      ...TYPOGRAPHY.body,
      fontWeight: "500",
    } as object,
  });
