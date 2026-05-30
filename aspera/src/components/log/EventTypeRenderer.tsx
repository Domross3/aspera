// Renders one EventTypeDef's section in the Log tab. Handles both
// cardinality modes:
//
//   - "single"    → one entry per day, fields rendered inline.
//   - "recurrent" → a stack of timestamped entry cards with a "+ Add" row.
//
// The parent owns all of the day's entries on `DailyLog.eventEntries`.
// This component takes only the pre-filtered subset for its `type` and
// returns the next subset via `onChange` — the parent merges back into
// the larger entries array. That keeps the renderer purely controlled.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";
import type { EventEntry, EventTypeDef } from "../../types";
import FieldRenderer, { defaultValueFor } from "./fields";

interface Props {
  type: EventTypeDef;
  // Pre-filtered to this type, in chronological order (oldest first).
  entries: EventEntry[];
  date: string; // "YYYY-MM-DD" of the log being edited
  isPastDay: boolean; // affects default timestamp for new recurrent entries
  onChange: (next: EventEntry[]) => void;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    fieldStack: {
      gap: SPACING.md,
    },
    recurrentWrap: {
      gap: SPACING.sm,
    },
    emptyHint: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontStyle: "italic",
    } as object,
    entryCard: {
      backgroundColor: c.surface,
      borderRadius: RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: SPACING.md,
      gap: SPACING.md,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeChip: {
      ...TYPOGRAPHY.caption,
      color: c.accent,
      fontWeight: "700",
      fontSize: 13,
    } as object,
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
    },
    addText: {
      ...TYPOGRAPHY.body,
      color: c.accent,
      fontWeight: "600",
      fontSize: 14,
    } as object,
  });

function buildSeedFieldValues(
  fields: EventTypeDef["fields"],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.id] = defaultValueFor(f);
  return out;
}

function defaultTimestampForDate(date: string, isPastDay: boolean): number {
  if (!isPastDay) return Date.now();
  // Past day → noon on that date, so the reading is honest ("approximate")
  // rather than misleadingly precise.
  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  const at = new Date();
  at.setFullYear(y, m - 1, d);
  at.setHours(12, 0, 0, 0);
  return at.getTime();
}

function formatTimeChip(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function generateEntryId(typeId: string, date: string): string {
  // Per-entry ids are local; the cloud upsert keys on (user_id, date) and
  // overwrites the whole DailyLog blob, so collision concerns are nil.
  return `${date}-${typeId}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function EventTypeRenderer({
  type,
  entries,
  date,
  isPastDay,
  onChange,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // ── Single cardinality ────────────────────────────────────────────────
  if (type.cardinality === "single") {
    const entry = entries[0];

    const ensureEntry = (): EventEntry => {
      if (entry) return entry;
      // Implicit first entry — created on first field touch.
      return {
        id: generateEntryId(type.id, date),
        typeId: type.id,
        date,
        fieldValues: buildSeedFieldValues(type.fields),
        createdAt: Date.now(),
      };
    };

    const updateField = (fieldId: string, value: unknown) => {
      const base = ensureEntry();
      const nextEntry: EventEntry = {
        ...base,
        fieldValues: { ...base.fieldValues, [fieldId]: value },
      };
      onChange([nextEntry]);
    };

    return (
      <View style={styles.fieldStack}>
        {type.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={entry?.fieldValues[field.id]}
            onChange={(v) => updateField(field.id, v)}
          />
        ))}
      </View>
    );
  }

  // ── Recurrent cardinality ─────────────────────────────────────────────
  const addEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next: EventEntry = {
      id: generateEntryId(type.id, date),
      typeId: type.id,
      date,
      timestamp: defaultTimestampForDate(date, isPastDay),
      fieldValues: buildSeedFieldValues(type.fields),
      createdAt: Date.now(),
    };
    onChange([...entries, next]);
  };

  const removeEntry = (id: string) => {
    Alert.alert("Remove entry?", "This will permanently delete this entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onChange(entries.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  const updateEntryField = (id: string, fieldId: string, value: unknown) => {
    onChange(
      entries.map((e) =>
        e.id === id
          ? { ...e, fieldValues: { ...e.fieldValues, [fieldId]: value } }
          : e,
      ),
    );
  };

  // Time picker for an entry's timestamp is intentionally deferred to a
  // follow-up commit — for now the entry shows the time it was created
  // (or noon for past-day backfills) and the user can re-add to adjust.
  // Phase 4's retroactive logging adds the picker affordance.

  return (
    <View style={styles.recurrentWrap}>
      {entries.length === 0 ? (
        <Text style={styles.emptyHint}>
          No entries yet — tap "+ Add" when {type.name.toLowerCase()} happens.
        </Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.timeChip}>
                {entry.timestamp ? formatTimeChip(entry.timestamp) : "—"}
              </Text>
              <TouchableOpacity
                onPress={() => removeEntry(entry.id)}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldStack}>
              {type.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={entry.fieldValues[field.id]}
                  onChange={(v) => updateEntryField(entry.id, field.id, v)}
                />
              ))}
            </View>
          </View>
        ))
      )}
      <TouchableOpacity
        onPress={addEntry}
        activeOpacity={0.7}
        style={styles.addRow}
      >
        <Ionicons name="add-circle" size={18} color={colors.accent} />
        <Text style={styles.addText}>Add {type.name.toLowerCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}
