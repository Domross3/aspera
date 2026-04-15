import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import GradientCard from "./GradientCard";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";

export interface TrendPoint {
  label: string;
  value: number;
}

interface Props {
  title: string;
  subtitle?: string;
  accentColor: string;
  points: TrendPoint[];
  maxValue: number;
  minValue?: number;
  averageLabel?: string;
  formatValue?: (value: number) => string;
}

const CHART_HEIGHT = 120;
const LABEL_ROW_HEIGHT = 24;
const TOP_PADDING = 10;
const DOT_SIZE = 10;

function defaultFormatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function TrendLineCard({
  title,
  subtitle,
  accentColor,
  points,
  maxValue,
  minValue = 0,
  averageLabel = "AVG",
  formatValue = defaultFormatValue,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const safePoints = points.filter((point) => Number.isFinite(point.value));
  const average = useMemo(() => {
    if (safePoints.length === 0) return 0;
    return (
      safePoints.reduce((sum, point) => sum + point.value, 0) /
      safePoints.length
    );
  }, [safePoints]);

  const plottedPoints = useMemo(() => {
    if (safePoints.length === 0 || chartWidth === 0) return [];

    const usableWidth = Math.max(chartWidth - DOT_SIZE, 1);
    const usableHeight =
      CHART_HEIGHT - TOP_PADDING - LABEL_ROW_HEIGHT - DOT_SIZE;
    const range = Math.max(maxValue - minValue, 1);

    return safePoints.map((point, index) => {
      const progressX =
        safePoints.length === 1 ? 0.5 : index / (safePoints.length - 1);
      const normalized = Math.min(
        1,
        Math.max(0, (point.value - minValue) / range),
      );
      const x = progressX * usableWidth + DOT_SIZE / 2;
      const y = TOP_PADDING + usableHeight * (1 - normalized);

      return { ...point, x, y };
    });
  }, [chartWidth, safePoints, maxValue, minValue]);

  const averageY = useMemo(() => {
    if (chartWidth === 0) return TOP_PADDING;
    const usableHeight =
      CHART_HEIGHT - TOP_PADDING - LABEL_ROW_HEIGHT - DOT_SIZE;
    const range = Math.max(maxValue - minValue, 1);
    const normalized = Math.min(1, Math.max(0, (average - minValue) / range));
    return TOP_PADDING + usableHeight * (1 - normalized);
  }, [average, chartWidth, maxValue, minValue]);

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  if (safePoints.length === 0) return null;

  return (
    <GradientCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View
          style={[styles.averageBadge, { borderColor: `${accentColor}55` }]}
        >
          <Text style={styles.averageLabel}>{averageLabel}</Text>
          <Text style={[styles.averageValue, { color: accentColor }]}>
            {formatValue(average)}
          </Text>
        </View>
      </View>

      <View style={styles.chartShell} onLayout={handleChartLayout}>
        <View style={styles.gridLineTop} />
        <View style={styles.gridLineBottom} />
        <View
          style={[
            styles.averageLine,
            { top: averageY, borderColor: `${accentColor}66` },
          ]}
        />

        {plottedPoints.slice(1).map((point, index) => {
          const previous = plottedPoints[index];
          const deltaX = point.x - previous.x;
          const deltaY = point.y - previous.y;
          const width = Math.sqrt(deltaX ** 2 + deltaY ** 2);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          return (
            <View
              key={`${title}-segment-${index}`}
              style={[
                styles.segment,
                {
                  backgroundColor: accentColor,
                  width,
                  left: (previous.x + point.x) / 2 - width / 2,
                  top: (previous.y + point.y) / 2 - 1,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}

        {plottedPoints.map((point, index) => (
          <View
            key={`${title}-dot-${index}-${point.label}`}
            style={[
              styles.dot,
              {
                borderColor: accentColor,
                left: point.x - DOT_SIZE / 2,
                top: point.y - DOT_SIZE / 2,
              },
            ]}
          />
        ))}

        <View style={styles.labelRow}>
          {safePoints.map((point, index) => (
            <View
              key={`${title}-label-${index}-${point.label}`}
              style={styles.labelCell}
            >
              <Text style={styles.valueLabel}>{formatValue(point.value)}</Text>
              <Text style={styles.pointLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  } as object,
  averageBadge: {
    minWidth: 72,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  averageLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 8,
  } as object,
  averageValue: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: "700",
  } as object,
  chartShell: {
    height: CHART_HEIGHT,
    position: "relative",
    justifyContent: "flex-end",
  },
  gridLineTop: {
    position: "absolute",
    top: TOP_PADDING,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  gridLineBottom: {
    position: "absolute",
    bottom: LABEL_ROW_HEIGHT,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  averageLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  segment: {
    position: "absolute",
    height: 2,
    borderRadius: RADIUS.pill,
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: LABEL_ROW_HEIGHT,
    marginTop: "auto",
    gap: SPACING.xs,
  },
  labelCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  valueLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  } as object,
  pointLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 9,
  } as object,
});
