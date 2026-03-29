import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  value: number;  // 1–10
  disabled?: boolean;
  onChange: (v: number) => void;
}

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 28;
const NUM_SEGMENTS = 10;

export default function IntensitySlider({ value, disabled = false, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const handleTouch = (x: number) => {
    if (trackWidth === 0) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const newVal = Math.max(1, Math.min(10, Math.round(ratio * 10)));
    onChange(newVal);
  };

  const thumbOffset = trackWidth > 0 ? ((value - 1) / 9) * (trackWidth - THUMB_SIZE) : 0;
  const intensityColor = disabled ? COLORS.textMuted : COLORS.intensity[value - 1] ?? COLORS.accent;

  return (
    <View style={disabled && styles.disabled}>
      <View
        style={styles.trackContainer}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Segment track */}
        <View style={styles.track}>
          {Array.from({ length: NUM_SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: disabled
                    ? COLORS.border
                    : i < value
                    ? COLORS.intensity[i]
                    : COLORS.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Thumb — only render after layout */}
        {trackWidth > 0 && (
          <View
            style={[
              styles.thumb,
              {
                left: thumbOffset,
                backgroundColor: intensityColor,
                shadowColor: intensityColor,
              },
            ]}
          />
        )}
      </View>

      <View style={styles.labels}>
        <Text style={styles.labelText}>Low</Text>
        <Text style={[styles.valueText, { color: intensityColor }]}>
          {disabled ? '—' : value} / 10
        </Text>
        <Text style={styles.labelText}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  trackContainer: {
    height: THUMB_SIZE + SPACING.sm,
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    gap: 2,
    marginHorizontal: THUMB_SIZE / 2,
  },
  segment: {
    flex: 1,
    borderRadius: RADIUS.sm,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: SPACING.sm / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  labelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  valueText: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '700',
  } as object,
});
