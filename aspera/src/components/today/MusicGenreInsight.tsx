import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientCard from "../common/GradientCard";
import { DailyLog } from "../../types";
import { SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  currentGenres: string[];
  recentLogs: DailyLog[];
}

interface GenreStat {
  genre: string;
  count: number;
  avgFocus: number;
  avgEnergy: number;
  avgTasks: number;
  focusDelta: number;
}

function formatGenreLabel(genre: string): string {
  return genre
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildGenreStats(
  currentGenres: string[],
  recentLogs: DailyLog[],
): GenreStat[] {
  if (recentLogs.length === 0) return [];

  const normalizedGenres = [
    ...new Set(
      currentGenres
        .map((genre) => genre.trim().toLowerCase())
        .filter((genre) => genre.length > 0 && genre !== "none"),
    ),
  ];

  if (normalizedGenres.length === 0) return [];

  const baselineFocus =
    recentLogs.reduce((sum, log) => sum + log.output.focusRating, 0) /
    recentLogs.length;

  return normalizedGenres
    .map((genre) => {
      const matchingDays = recentLogs.filter((log) =>
        log.music.some((entry) => entry.trim().toLowerCase() === genre),
      );

      if (matchingDays.length === 0) return null;

      const avgFocus =
        matchingDays.reduce((sum, log) => sum + log.output.focusRating, 0) /
        matchingDays.length;
      const avgEnergy =
        matchingDays.reduce((sum, log) => sum + log.output.energyRating, 0) /
        matchingDays.length;
      const avgTasks =
        matchingDays.reduce((sum, log) => sum + log.output.tasksCompleted, 0) /
        matchingDays.length;

      return {
        genre,
        count: matchingDays.length,
        avgFocus: round(avgFocus),
        avgEnergy: round(avgEnergy),
        avgTasks: round(avgTasks),
        focusDelta: round(avgFocus - baselineFocus),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const left = a as GenreStat;
      const right = b as GenreStat;
      if (right.avgFocus !== left.avgFocus)
        return right.avgFocus - left.avgFocus;
      if (right.avgTasks !== left.avgTasks)
        return right.avgTasks - left.avgTasks;
      return right.count - left.count;
    }) as GenreStat[];
}

function formatDelta(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

export default function MusicGenreInsight({
  currentGenres,
  recentLogs,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const stats = buildGenreStats(currentGenres, recentLogs);

  if (stats.length === 0) return null;

  const leadGenre = stats[0];
  const leadGenreLabel = formatGenreLabel(leadGenre.genre);
  const body =
    leadGenre.count > 1
      ? `${leadGenreLabel} days are averaging ${leadGenre.avgFocus.toFixed(1)}/5 focus, ${leadGenre.avgEnergy.toFixed(1)}/5 energy, and ${leadGenre.avgTasks.toFixed(1)} tasks across ${leadGenre.count} logs.`
      : `${leadGenreLabel} is only logged once so far, but it landed at ${leadGenre.avgFocus.toFixed(1)}/5 focus and ${leadGenre.avgTasks.toFixed(1)} tasks.`;

  return (
    <GradientCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>🎧</Text>
        <Text style={styles.eyebrow}>GENRE INSIGHT</Text>
      </View>

      <Text style={styles.title}>
        {leadGenre.focusDelta >= 0
          ? `${leadGenreLabel} is your sharpest genre right now`
          : `${leadGenreLabel} is your current music baseline`}
      </Text>

      <Text style={styles.body}>{body}</Text>

      <View style={styles.chipRow}>
        {stats.map((stat) => {
          const active = stat.genre === leadGenre.genre;
          return (
            <View
              key={stat.genre}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {formatGenreLabel(stat.genre)} {formatDelta(stat.focusDelta)}{" "}
                focus
              </Text>
            </View>
          );
        })}
      </View>
    </GradientCard>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    card: {
      marginTop: SPACING.md,
      borderWidth: 1,
      borderColor: "rgba(43, 211, 231, 0.18)",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginBottom: SPACING.xs,
    },
    icon: { fontSize: 14 },
    eyebrow: {
      ...TYPOGRAPHY.label,
      color: c.accentAlt,
      fontSize: 9,
    } as object,
    title: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
      marginBottom: SPACING.xs,
    } as object,
    body: {
      ...TYPOGRAPHY.body,
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    } as object,
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    chip: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs + 1,
      borderRadius: RADIUS.pill,
      backgroundColor: c.surfaceElevated,
    },
    chipActive: {
      backgroundColor: "rgba(43, 211, 231, 0.16)",
      borderWidth: 1,
      borderColor: "rgba(43, 211, 231, 0.28)",
    },
    chipText: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 11,
      fontWeight: "700",
    } as object,
    chipTextActive: {
      color: c.accentAlt,
    },
  });
