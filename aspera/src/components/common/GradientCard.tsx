import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  padded?: boolean;
}

export default function GradientCard({ children, style, colors, padded = true }: Props) {
  return (
    <LinearGradient
      colors={(colors ?? COLORS.gradients.card) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
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
