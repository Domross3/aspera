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
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Metric {
  name: string;
  value: number;
}

interface Props {
  metrics: Metric[];
  onChange: (metrics: Metric[]) => void;
}

export default function CustomMetrics({ metrics, onChange }: Props) {
  const [newName, setNewName] = useState("");

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
                color={COLORS.textMuted}
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
          placeholderTextColor={COLORS.textMuted}
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
            color={newName.trim() ? COLORS.text : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
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
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 14,
    minWidth: 36,
    textAlign: "center",
  } as object,
  adjBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  adjText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
  } as object,
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    backgroundColor: COLORS.surfaceElevated,
  },
});
