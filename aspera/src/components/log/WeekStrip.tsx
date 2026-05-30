// WeekStrip — horizontal row of date tiles for the Log tab's retroactive
// backfill flow. Today + the previous 6 days, tappable, with the active
// day highlighted. Window is hard-coded at 7 days for v1 since that's
// what the user committed to in the design — surface as a setting later
// if longer windows become useful.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  selectedDate: string; // "YYYY-MM-DD"
  onSelect: (date: string) => void;
  windowDays?: number; // default 7 (today + 6 prior)
}

interface DayTile {
  date: string;
  dayLabel: string; // "Mo"
  dayNumber: number; // 1..31
  isToday: boolean;
}

function buildDays(windowDays: number): DayTile[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const tiles: DayTile[] = [];
  for (let daysAgo = windowDays - 1; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    tiles.push({
      date: dateStr,
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return tiles;
}

export default function WeekStrip({
  selectedDate,
  onSelect,
  windowDays = 7,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const tiles = buildDays(windowDays);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tiles.map((tile) => {
        const active = tile.date === selectedDate;
        return (
          <TouchableOpacity
            key={tile.date}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync();
              onSelect(tile.date);
            }}
            activeOpacity={0.7}
            style={[
              styles.tile,
              active && styles.tileActive,
              tile.isToday && !active && styles.tileToday,
            ]}
          >
            <Text style={[styles.day, active && styles.dayActive]}>
              {tile.dayLabel}
            </Text>
            <Text style={[styles.num, active && styles.numActive]}>
              {tile.dayNumber}
            </Text>
            {tile.isToday ? (
              <View
                style={[styles.todayDot, active && styles.todayDotActive]}
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const TILE_WIDTH = 44;

const makeStyles = (c: AsperaColors) => ({
  row: {
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  tile: {
    width: TILE_WIDTH,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center" as const,
    gap: 2,
  },
  tileActive: {
    borderColor: c.accent,
    backgroundColor: c.accentGlow,
  },
  tileToday: {
    borderColor: c.ring,
  },
  day: {
    ...TYPOGRAPHY.label,
    color: c.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  } as object,
  dayActive: {
    color: c.accent,
    fontWeight: "700" as const,
  } as object,
  num: {
    ...TYPOGRAPHY.subtitle,
    color: c.text,
    fontWeight: "700" as const,
  } as object,
  numActive: {
    color: c.accent,
  } as object,
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.accent,
    marginTop: 2,
  },
  todayDotActive: {
    backgroundColor: c.accent,
  },
});
