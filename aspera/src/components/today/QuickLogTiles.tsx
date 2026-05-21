// QuickLogTiles — one-tap loggers for the user's recurrent event types,
// surfaced on Today so multiply-occurring things ("had coffee", "took a
// dose", "stretched") don't require scrolling to the bottom of the Log
// tab. Each tap appends a new EventEntry with the current timestamp +
// the field defaults seeded from the EventTypeDef.
//
// Tiles only appear when the user has defined at least one recurrent
// event type — otherwise the section is silent.
//
// Long-press routes to the Log tab so the user can fine-tune field values
// or remove a mistaken tap.

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import SectionLabel from "../common/SectionLabel";
import { useLogs } from "../../hooks/useLogs";
import { useSettings } from "../../hooks/useSettings";
import { defaultValueFor } from "../log/fields";
import type {
  DailyLog,
  EventEntry,
  EventTypeDef,
  FieldDef,
} from "../../types";

function todayId(): string {
  return new Date().toISOString().split("T")[0];
}

function buildSeedFieldValues(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.id] = defaultValueFor(f);
  return out;
}

function generateEntryId(typeId: string, date: string): string {
  return `${date}-${typeId}-${Math.random().toString(36).slice(2, 10)}`;
}

function blankLogShell(date: string): DailyLog {
  return {
    id: date,
    date,
    createdAt: Date.now(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    output: { tasksCompleted: 0, focusRating: 3, energyRating: 3 },
    tags: [],
    bigRocks: [],
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
    eventEntries: [],
    // A quick-log tile only records an event entry — it must not imply the
    // user rated their day's focus/energy. Excluded from trends until rated.
    outputRated: false,
  };
}

export default function QuickLogTiles() {
  const router = useRouter();
  const { settings } = useSettings();
  const { todayLog, save } = useLogs();

  const recurrentTypes = (settings.eventTypes ?? []).filter(
    (t) => t.cardinality === "recurrent",
  );

  if (recurrentTypes.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.xl }}>
      <SectionLabel label="Quick Log" />
      <View style={styles.grid}>
        {recurrentTypes.map((type) => (
          <QuickLogTile
            key={type.id}
            type={type}
            todayLog={todayLog}
            onAdd={(entry) => {
              const base = todayLog ?? blankLogShell(todayId());
              const next: DailyLog = {
                ...base,
                eventEntries: [...(base.eventEntries ?? []), entry],
              };
              void save(next);
            }}
            onLongPress={() => router.push("/(tabs)/log")}
          />
        ))}
      </View>
    </View>
  );
}

interface TileProps {
  type: EventTypeDef;
  todayLog: DailyLog | null;
  onAdd: (entry: EventEntry) => void;
  onLongPress: () => void;
}

function QuickLogTile({ type, todayLog, onAdd, onLongPress }: TileProps) {
  const [justAdded, setJustAdded] = useState(false);
  const bumpAnim = useRef(new Animated.Value(1)).current;

  const todayCount = (todayLog?.eventEntries ?? []).filter(
    (e) => e.typeId === type.id,
  ).length;

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = todayId();
    onAdd({
      id: generateEntryId(type.id, today),
      typeId: type.id,
      date: today,
      timestamp: Date.now(),
      fieldValues: buildSeedFieldValues(type.fields),
      createdAt: Date.now(),
    });

    // Brief "added" affordance — scales the tile and shows a checkmark
    // so the user knows the tap registered without a full sheet.
    setJustAdded(true);
    Animated.sequence([
      Animated.timing(bumpAnim, {
        toValue: 1.06,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bumpAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setJustAdded(false), 600);
    });
  };

  return (
    <Animated.View
      style={[styles.tileWrap, { transform: [{ scale: bumpAnim }] }]}
    >
      <TouchableOpacity
        onPress={handleTap}
        onLongPress={onLongPress}
        delayLongPress={350}
        activeOpacity={0.75}
        style={styles.tile}
      >
        <View style={styles.tileTop}>
          {type.emoji ? (
            <Text style={styles.tileEmoji}>{type.emoji}</Text>
          ) : (
            <View style={styles.tileEmojiPlaceholder} />
          )}
          {todayCount > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{todayCount}×</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.tileName} numberOfLines={2}>
          {type.name}
        </Text>
        <Text style={styles.tileCta}>
          {justAdded ? "✓ Logged" : "Tap to log"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
  },
  tileWrap: {
    width: "50%",
    padding: SPACING.xs,
  },
  tile: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
    minHeight: 92,
  },
  tileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileEmojiPlaceholder: {
    width: 22,
    height: 22,
  },
  countPill: {
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  countPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  } as object,
  tileName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  } as object,
  tileCta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
});
