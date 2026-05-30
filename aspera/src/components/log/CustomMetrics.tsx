import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Metric {
  name: string;
  value: number;
}

interface Props {
  metrics: Metric[];
  onChange: (metrics: Metric[]) => void;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    heading: {
      ...TYPOGRAPHY.body,
      color: c.textSecondary,
      marginBottom: SPACING.md,
      fontSize: 13,
    } as object,
    metricRow: {
      marginBottom: SPACING.sm,
    },
    metricHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.xs,
    },
    metricName: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
      fontSize: 15,
    } as object,
    dotsRow: {
      flexDirection: "row",
      gap: 4,
      marginBottom: SPACING.xs,
    },
    dot: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.border,
    },
    dotActive: {
      backgroundColor: c.accent,
    },
    metricValueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.md,
      marginBottom: SPACING.xs,
    },
    metricValue: {
      ...TYPOGRAPHY.caption,
      color: c.accent,
      fontWeight: "700",
      fontSize: 14,
      minWidth: 36,
      textAlign: "center",
    } as object,
    adjBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    adjText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: SPACING.sm,
    },
    addRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    input: {
      ...TYPOGRAPHY.body,
      flex: 1,
      color: c.text,
      backgroundColor: c.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: 13,
    } as object,
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnDisabled: {
      backgroundColor: c.surfaceElevated,
    },
  });

export default function CustomMetrics({ metrics, onChange }: Props) {
  const [newName, setNewName] = useState("");
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const addMetric = () => {
    const name = newName.trim();
    if (
      !name ||
      metrics.some((m) => m.name.toLowerCase() === name.toLowerCase())
    )
      return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange([...metrics, { name, value: 5 }]);
    setNewName("");
  };

  const updateValue = (index: number, value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    const updated = [...metrics];
    updated[index] = { ...updated[index], value: clamped };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(updated);
  };

  const removeMetric = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(metrics.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text style={styles.heading}>Track anything that matters to you</Text>

      {/* Existing metrics */}
      {metrics.map((metric, i) => (
        <View key={`${metric.name}-${i}`} style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricName}>{metric.name}</Text>
            <TouchableOpacity
              onPress={() => removeMetric(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Tappable dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: 10 }).map((_, dot) => {
              const dotVal = dot + 1;
              const active = dotVal <= metric.value;
              return (
                <TouchableOpacity
                  key={dot}
                  style={[styles.dot, active && styles.dotActive]}
                  onPress={() => updateValue(i, dotVal)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>

          <View style={styles.metricValueRow}>
            <TouchableOpacity
              style={styles.adjBtn}
              onPress={() => updateValue(i, metric.value - 1)}
            >
              <Text style={styles.adjText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.metricValue}>{metric.value}/10</Text>
            <TouchableOpacity
              style={styles.adjBtn}
              onPress={() => updateValue(i, metric.value + 1)}
            >
              <Text style={styles.adjText}>+</Text>
            </TouchableOpacity>
          </View>

          {i < metrics.length - 1 && <View style={styles.divider} />}
        </View>
      ))}

      {/* Add new metric */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="e.g. Motivation, Creativity, Soreness"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={addMetric}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.addBtn, !newName.trim() && styles.addBtnDisabled]}
          onPress={addMetric}
          disabled={!newName.trim()}
        >
          <Ionicons
            name="add"
            size={20}
            color={newName.trim() ? colors.text : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
