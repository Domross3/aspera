import React, { useEffect, useRef } from "react";
import { Animated, Text, TextStyle } from "react-native";

interface Props {
  value: number;
  style?: TextStyle;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  style,
  duration = 800,
}: Props) {
  const animVal = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    animVal.addListener(({ value: v }) => {
      const rounded = Math.round(v);
      if (rounded !== displayRef.current) {
        displayRef.current = rounded;
        setDisplay(rounded);
      }
    });

    return () => animVal.removeAllListeners();
  }, [value]);

  return <Text style={style}>{display}</Text>;
}
