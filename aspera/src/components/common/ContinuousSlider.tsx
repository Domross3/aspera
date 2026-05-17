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
  // Override the right-side value label. Defaults to `${value.toFixed(1)}/${max}`
  // which matches the original Quick Mood callers; integer-only callers (e.g.
  // notification frequency 1–8) can format as `3× / day` instead.
  formatValue?: (value: number, max: number) => string;
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
  formatValue,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  // Throttle haptics to half-step boundaries (1.0, 1.5, 2.0, ...) — firing
  // on every tenth (40 ticks across the range) reads as "rattly" even when
  // the value tracking is smooth. 9 ticks across the range gives clear
  // landmarks without buzzing.
  const lastHapticBucket = useRef(Math.round(value * 2));
  // Anchor the touch in the parent view's coordinate space at grant time,
  // then use gestureState.dx (screen-space pixel delta) for moves. Avoids
  // the locationX-flips-when-finger-crosses-a-child-view bug that PanResponder
  // has when there's an absolutely positioned thumb on top of the track.
  const startTouchX = useRef(0);

  const computeAndCommit = (x: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const clamped = Math.max(0, Math.min(w, x));
    const ratio = clamped / w;
    const raw = min + ratio * (max - min);
    const next = roundToStep(raw, step, min);
    const valueClamped = Math.max(min, Math.min(max, next));

    const hapticBucket = Math.round(valueClamped * 2);
    if (hapticBucket !== lastHapticBucket.current) {
      Haptics.selectionAsync();
      lastHapticBucket.current = hapticBucket;
    }
    onChange(valueClamped);
  };

  const panResponder = useRef(
    PanResponder.create({
      // Capture handlers run before children/parents get a shot. Combined with
      // onShouldBlockNativeResponder=true below, this tells iOS that JS owns
      // the touch — keeps ScrollViews and modal sheet gestures from stealing
      // mid-drag (especially when fingers drift vertically while sliding).
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        startTouchX.current = e.nativeEvent.locationX;
        computeAndCommit(e.nativeEvent.locationX);
      },
      onPanResponderMove: (_e, g) => {
        computeAndCommit(startTouchX.current + g.dx);
      },
    }),
  ).current;

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const thumbCenter = ratio * trackWidth;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>
          {formatValue ? formatValue(value, max) : `${value.toFixed(1)}/${max}`}
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
            pointerEvents="none"
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
