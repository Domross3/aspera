// Draggable continuous slider with stepped snapping (e.g. 0.1 increments).
//
// JS-only (PanResponder + plain View), so OTA-shippable — no native module.
// Used by the Quick Mood Capture modal (mood + energy on a 1.0–5.0 range
// with 0.1 step). The existing RatingSlider in src/components/log/ stays
// untouched for the Log tab's discrete scale; once we revisit the Log tab
// we can swap it for this if you want the same continuous feel there.

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  accentColor?: string;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;
const TOUCH_HEIGHT = 44; // generous tappable area

function roundToStep(value: number, step: number, min: number): number {
  const stepCount = Math.round((value - min) / step);
  const stepped = min + stepCount * step;
  // Round display to 1 decimal — avoids 3.0000000004 artefacts.
  return Math.round(stepped * 10) / 10;
}

export default function ContinuousSlider({
  label,
  value,
  min = 1,
  max = 5,
  step = 0.1,
  onChange,
  accentColor = COLORS.accent,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const lastHapticValue = useRef(value);

  const updateFromX = (rawX: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const x = Math.max(0, Math.min(w, rawX));
    const ratio = x / w;
    const raw = min + ratio * (max - min);
    const next = roundToStep(raw, step, min);
    const clamped = Math.max(min, Math.min(max, next));

    if (clamped !== lastHapticValue.current) {
      // Light tick on every tenth — feels like a physical slider.
      Haptics.selectionAsync();
      lastHapticValue.current = clamped;
    }
    onChange(clamped);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
    }),
  ).current;

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const thumbCenter = ratio * trackWidth;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>
          {value.toFixed(1)}/{max}
        </Text>
      </View>

      <View
        style={styles.touchArea}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: thumbCenter, backgroundColor: accentColor },
            ]}
          />
        </View>
        {trackWidth > 0 && (
          <View
            style={[
              styles.thumb,
              {
                left: thumbCenter - THUMB_SIZE / 2,
                backgroundColor: accentColor,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
  value: {
    ...TYPOGRAPHY.title,
    fontWeight: "700",
  } as object,
  touchArea: {
    height: TOUCH_HEIGHT,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: RADIUS.pill,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
