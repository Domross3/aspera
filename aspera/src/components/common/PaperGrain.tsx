import React from "react";
import { DimensionValue, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/theme";

const DOTS = Array.from({ length: 72 }, (_, index) => ({
  key: `grain-${index}`,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 100}%`,
  opacity: 0.12 + ((index * 17) % 30) / 100,
}));

export default function PaperGrain() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((dot) => (
        <View
          key={dot.key}
          style={[
            styles.dot,
            {
              left: dot.left as DimensionValue,
              top: dot.top as DimensionValue,
              opacity: COLORS.grain * dot.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 1,
    height: 1,
    borderRadius: 1,
    backgroundColor: COLORS.text,
  },
});
