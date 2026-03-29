import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  label: string;
  style?: ViewStyle;
}

export default function SectionLabel({ label, style }: Props) {
  return (
    <View style={[{ marginBottom: SPACING.sm }, style]}>
      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.textMuted }}>{label}</Text>
    </View>
  );
}
