import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  padded?: boolean;
}

export default function GradientCard({
  children,
  style,
  colors,
  padded = true,
}: Props) {
  const { colors: themeColors } = useTheme();
  return (
    <LinearGradient
      colors={
        (colors ?? themeColors.gradients.card) as [string, string, ...string[]]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: themeColors.border,
          ...(padded ? { padding: SPACING.md } : {}),
          ...SHADOWS.card,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
