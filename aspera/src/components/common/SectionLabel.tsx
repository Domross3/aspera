import React from "react";
import { Text, View, ViewStyle } from "react-native";
import { SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  label: string;
  style?: ViewStyle;
}

export default function SectionLabel({ label, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: SPACING.sm }, style]}>
      <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}
