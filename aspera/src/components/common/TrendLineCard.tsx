import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import GradientCard from "./GradientCard";
import { SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

// `value: null` represents a day with no data. The chart leaves an empty
// slot on the x-axis (preserving the day label) and the line skips over
// it — no interpolation, no stretched-across-empty-days lines.
export interface TrendPoint {
  label: string;
  value: number | null;
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
  emptyStateMessage?: string;
  singleDayFooter?: string;
}

const CHART_HEIGHT = 120;
const LABEL_ROW_HEIGHT = 24;
const TOP_PADDING = 10;
const DOT_SIZE = 10;

function defaultFormatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function isFiniteValue(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
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
      color: c.text,
    } as object,
    subtitle: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
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
      color: c.textMuted,
      fontSize: 8,
    } as object,
    averageValue: {
      ...TYPOGRAPHY.subtitle,
      fontWeight: "700",
    } as object,

    // Mode 1 — empty
    emptyBody: {
      paddingVertical: SPACING.lg,
      alignItems: "center",
    },
    emptyText: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      textAlign: "center",
      paddingHorizontal: SPACING.md,
      lineHeight: 16,
    } as object,

    // Mode 2 — single day
    singleBody: {
      alignItems: "center",
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    singleValue: {
      fontSize: 36,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    singleLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      marginTop: 2,
    } as object,
    singleFooter: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      marginTop: SPACING.sm,
      fontSize: 11,
    } as object,

    // Mode 3 — full chart
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
      backgroundColor: c.surface,
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
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    } as object,
    pointLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 9,
    } as object,
  });

export default function TrendLineCard({
  title,
  subtitle,
  accentColor,
  points,
  maxValue,
  minValue = 0,
  averageLabel = "AVG",
  formatValue = defaultFormatValue,
  emptyStateMessage = "Capture a few times this week and a trend appears here.",
  singleDayFooter = "Day 1 of your trend",
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const styles = useThemedStyles(makeStyles);

  const finiteIndices = useMemo(
    () =>
      points
        .map((p, i) => (isFiniteValue(p.value) ? i : -1))
        .filter((i) => i >= 0),
    [points],
  );
  const finiteCount = finiteIndices.length;

  const average = useMemo(() => {
    if (finiteCount === 0) return 0;
    let sum = 0;
    for (const i of finiteIndices) sum += points[i].value as number;
    return sum / finiteCount;
  }, [points, finiteIndices, finiteCount]);

  const usableHeight = CHART_HEIGHT - TOP_PADDING - LABEL_ROW_HEIGHT - DOT_SIZE;
  const range = Math.max(maxValue - minValue, 1);

  // plottedPoints uses the FULL window length for x-axis spacing, so a
  // 2-day chart doesn't stretch across the full width. Null entries get
  // a position but `y === null` so they render no dot and break segments.
  const plottedPoints = useMemo(() => {
    if (chartWidth === 0 || points.length === 0) return [];
    const usableWidth = Math.max(chartWidth - DOT_SIZE, 1);
    const denom = Math.max(points.length - 1, 1);
    return points.map((p, index) => {
      const progressX = points.length === 1 ? 0.5 : index / denom;
      const x = progressX * usableWidth + DOT_SIZE / 2;
      if (!isFiniteValue(p.value)) {
        return { ...p, index, x, y: null as number | null };
      }
      const normalized = Math.min(1, Math.max(0, (p.value - minValue) / range));
      const y = TOP_PADDING + usableHeight * (1 - normalized);
      return { ...p, index, x, y };
    });
  }, [chartWidth, points, minValue, range, usableHeight]);

  const averageY = useMemo(() => {
    if (chartWidth === 0 || finiteCount === 0) return TOP_PADDING;
    const normalized = Math.min(1, Math.max(0, (average - minValue) / range));
    return TOP_PADDING + usableHeight * (1 - normalized);
  }, [average, chartWidth, minValue, range, usableHeight, finiteCount]);

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  // ── Mode 1: empty (no finite points) ───────────────────────────────────
  if (finiteCount === 0) {
    return (
      <GradientCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyText}>{emptyStateMessage}</Text>
        </View>
      </GradientCard>
    );
  }

  // ── Mode 2: single finite point (no line to draw) ──────────────────────
  if (finiteCount === 1) {
    const soleIndex = finiteIndices[0];
    const sole = points[soleIndex];
    const soleValue = sole.value as number;
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
              {formatValue(soleValue)}
            </Text>
          </View>
        </View>
        <View style={styles.singleBody}>
          <Text style={[styles.singleValue, { color: accentColor }]}>
            {formatValue(soleValue)}
          </Text>
          <Text style={styles.singleLabel}>{sole.label}</Text>
          <Text style={styles.singleFooter}>{singleDayFooter}</Text>
        </View>
      </GradientCard>
    );
  }

  // ── Mode 3: full chart with fixed window + gap-aware line ──────────────
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

        {/* Line segments — only between immediately-consecutive finite points.
            We never bridge across a null day, so missed days are visible as
            true gaps in the trend rather than smoothed-over by interpolation. */}
        {plottedPoints.slice(1).map((point, index) => {
          const previous = plottedPoints[index];
          if (point.y === null || previous.y === null) return null;
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

        {/* Dots — only on days with a finite value. */}
        {plottedPoints.map((point, index) =>
          point.y === null ? null : (
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
          ),
        )}

        {/* Labels always render — even null days show their day-name so the
            x-axis reads as a continuous week, with an em-dash where the
            value is missing. */}
        <View style={styles.labelRow}>
          {points.map((point, index) => (
            <View
              key={`${title}-label-${index}-${point.label}`}
              style={styles.labelCell}
            >
              <Text style={styles.valueLabel}>
                {isFiniteValue(point.value) ? formatValue(point.value) : "—"}
              </Text>
              <Text style={styles.pointLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </GradientCard>
  );
}
