import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

export function useFadeUp(
  activeKey: string | number | boolean = true,
): ViewStyle {
  const reducedMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (reducedMotion) {
      translateY.setValue(0);
      return;
    }

    translateY.setValue(8);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 900,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [activeKey, reducedMotion, translateY]);

  return useMemo(
    () => ({
      opacity: 1,
      transform: [{ translateY }],
    }),
    [translateY],
  );
}
