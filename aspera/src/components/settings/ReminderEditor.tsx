// ReminderEditor — bottom-sheet for creating / editing a UserReminder.
// Lives under Settings → Reminders. Mirrors the SchemaBuilder pattern so
// the two editor sheets feel like siblings.
//
// Form covers:
//   - Label (required)
//   - Schedule kind: "fixed" times list  OR  "random" count + window
//   - Weekday selector (Sun–Sat chips)
//   - Optional link to an EventTypeDef (dropdown)
//   - Delete (edit mode only)
//
// `proposedLoad` is the daily-notifications count this reminder would add;
// the caller (Settings screen) precomputes it including the in-progress
// draft so we can show the warning + hard cap inline.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import type { EventTypeDef, ReminderSchedule, UserReminder } from "../../types";
import TimePickerModal from "./TimePickerModal";

interface Props {
  visible: boolean;
  initial: UserReminder | null;
  eventTypes: EventTypeDef[];
  onCancel: () => void;
  onSave: (next: UserReminder) => void;
  onDelete?: () => void;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function genReminderId(): string {
  return `r-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDraft(): UserReminder {
  return {
    id: genReminderId(),
    label: "",
    schedule: { kind: "fixed", times: ["08:00"] },
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: Date.now(),
  };
}

export default function ReminderEditor({
  visible,
  initial,
  eventTypes,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<UserReminder>(
    () => initial ?? emptyDraft(),
  );
  const [timePickerIdx, setTimePickerIdx] = useState<number | null>(null);
  const [randomWindowSide, setRandomWindowSide] = useState<
    "start" | "end" | null
  >(null);

  useEffect(() => {
    if (visible) {
      setDraft(initial ?? emptyDraft());
      setTimePickerIdx(null);
      setRandomWindowSide(null);
    }
  }, [visible, initial]);

  const isEditing = !!initial;
  const canSave = draft.label.trim().length > 0;

  const setSchedule = (next: ReminderSchedule) => {
    setDraft((d) => ({ ...d, schedule: next }));
  };

  const toggleWeekday = (n: number) => {
    Haptics.selectionAsync();
    setDraft((d) => ({
      ...d,
      weekdays: d.weekdays.includes(n)
        ? d.weekdays.filter((x) => x !== n)
        : [...d.weekdays, n].sort(),
    }));
  };

  const setFixedTime = (index: number, value: string) => {
    if (draft.schedule.kind !== "fixed") return;
    const times = [...draft.schedule.times];
    times[index] = value;
    setSchedule({ kind: "fixed", times });
  };

  const addFixedTime = () => {
    if (draft.schedule.kind !== "fixed") return;
    setSchedule({
      kind: "fixed",
      times: [...draft.schedule.times, "12:00"],
    });
  };

  const removeFixedTime = (index: number) => {
    if (draft.schedule.kind !== "fixed") return;
    if (draft.schedule.times.length <= 1) return; // keep at least one
    setSchedule({
      kind: "fixed",
      times: draft.schedule.times.filter((_, i) => i !== index),
    });
  };

  const setRandomCount = (next: number) => {
    if (draft.schedule.kind !== "random") return;
    setSchedule({ ...draft.schedule, count: Math.max(1, Math.min(5, next)) });
  };

  const setLinkedType = (id: string | undefined) => {
    Haptics.selectionAsync();
    setDraft((d) => ({ ...d, linkedEventTypeId: id }));
  };

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...draft,
      label: draft.label.trim(),
      weekdays:
        draft.weekdays.length > 0 ? draft.weekdays : [0, 1, 2, 3, 4, 5, 6],
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      "Delete this reminder?",
      "Scheduled notifications will be cancelled. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdropTouch}
            onPress={onCancel}
          />
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onCancel} hitSlop={8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.titleText}>
                {isEditing ? "Edit reminder" : "New reminder"}
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={8}
              >
                <Text
                  style={[styles.doneText, !canSave && styles.doneDisabled]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>Label</Text>
              <TextInput
                placeholder="e.g. Drink water, Take lion's mane"
                placeholderTextColor={COLORS.textMuted}
                value={draft.label}
                onChangeText={(v) => setDraft((d) => ({ ...d, label: v }))}
                style={styles.input}
                maxLength={60}
                returnKeyType="done"
              />

              <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
                Schedule
              </Text>
              <View style={styles.kindRow}>
                <KindTile
                  label="Specific times"
                  active={draft.schedule.kind === "fixed"}
                  onPress={() =>
                    setSchedule({ kind: "fixed", times: ["08:00"] })
                  }
                />
                <KindTile
                  label="Random window"
                  active={draft.schedule.kind === "random"}
                  onPress={() =>
                    setSchedule({
                      kind: "random",
                      count: 3,
                      windowStart: "09:00",
                      windowEnd: "17:00",
                    })
                  }
                />
              </View>

              {draft.schedule.kind === "fixed" ? (
                <View style={{ marginTop: SPACING.md }}>
                  {draft.schedule.times.map((t, i) => (
                    <View key={i} style={styles.timeRow}>
                      <TouchableOpacity
                        onPress={() => setTimePickerIdx(i)}
                        activeOpacity={0.7}
                        style={styles.timeChip}
                      >
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={COLORS.accent}
                        />
                        <Text style={styles.timeChipText}>{t}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeFixedTime(i)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={COLORS.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={addFixedTime}
                    activeOpacity={0.7}
                    style={styles.addInlineRow}
                  >
                    <Ionicons
                      name="add-circle"
                      size={16}
                      color={COLORS.accent}
                    />
                    <Text style={styles.addInlineText}>Add another time</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={styles.miniLabel}>Times per active day</Text>
                  <View style={styles.countStepper}>
                    <TouchableOpacity
                      onPress={() =>
                        setRandomCount(
                          draft.schedule.kind === "random"
                            ? draft.schedule.count - 1
                            : 1,
                        )
                      }
                      hitSlop={8}
                      style={styles.adjBtn}
                    >
                      <Text style={styles.adjText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.countValue}>
                      {draft.schedule.kind === "random"
                        ? draft.schedule.count
                        : 0}
                      × / day
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setRandomCount(
                          draft.schedule.kind === "random"
                            ? draft.schedule.count + 1
                            : 1,
                        )
                      }
                      hitSlop={8}
                      style={styles.adjBtn}
                    >
                      <Text style={styles.adjText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.windowRow}>
                    <View style={styles.windowCell}>
                      <Text style={styles.miniLabel}>From</Text>
                      <TouchableOpacity
                        onPress={() => setRandomWindowSide("start")}
                        activeOpacity={0.7}
                        style={styles.timeChip}
                      >
                        <Text style={styles.timeChipText}>
                          {draft.schedule.kind === "random"
                            ? draft.schedule.windowStart
                            : "09:00"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.windowCell}>
                      <Text style={styles.miniLabel}>To</Text>
                      <TouchableOpacity
                        onPress={() => setRandomWindowSide("end")}
                        activeOpacity={0.7}
                        style={styles.timeChip}
                      >
                        <Text style={styles.timeChipText}>
                          {draft.schedule.kind === "random"
                            ? draft.schedule.windowEnd
                            : "17:00"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
                Days
              </Text>
              <View style={styles.weekdaysRow}>
                {WEEKDAY_LABELS.map((label, i) => {
                  const active = draft.weekdays.includes(i);
                  return (
                    <TouchableOpacity
                      key={`${label}-${i}`}
                      onPress={() => toggleWeekday(i)}
                      activeOpacity={0.7}
                      style={[
                        styles.weekdayChip,
                        active && styles.weekdayChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          active && styles.weekdayTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {eventTypes.length > 0 ? (
                <>
                  <Text
                    style={[styles.sectionLabel, { marginTop: SPACING.lg }]}
                  >
                    Linked metric (optional)
                  </Text>
                  <View style={styles.linkRow}>
                    <TouchableOpacity
                      onPress={() => setLinkedType(undefined)}
                      activeOpacity={0.7}
                      style={[
                        styles.linkChip,
                        !draft.linkedEventTypeId && styles.linkChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.linkChipText,
                          !draft.linkedEventTypeId && styles.linkChipTextActive,
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {eventTypes.map((t) => {
                      const active = draft.linkedEventTypeId === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setLinkedType(t.id)}
                          activeOpacity={0.7}
                          style={[
                            styles.linkChip,
                            active && styles.linkChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.linkChipText,
                              active && styles.linkChipTextActive,
                            ]}
                          >
                            {t.emoji ? `${t.emoji} ` : ""}
                            {t.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {isEditing && onDelete ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  style={styles.deleteRow}
                >
                  <Text style={styles.deleteText}>Delete this reminder</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={timePickerIdx !== null}
        initial={
          timePickerIdx !== null &&
          draft.schedule.kind === "fixed" &&
          draft.schedule.times[timePickerIdx]
            ? draft.schedule.times[timePickerIdx]
            : "08:00"
        }
        title="Pick a time"
        onCancel={() => setTimePickerIdx(null)}
        onConfirm={(hhmm) => {
          if (timePickerIdx !== null) setFixedTime(timePickerIdx, hhmm);
          setTimePickerIdx(null);
        }}
      />

      <TimePickerModal
        visible={randomWindowSide !== null}
        initial={
          randomWindowSide && draft.schedule.kind === "random"
            ? randomWindowSide === "start"
              ? draft.schedule.windowStart
              : draft.schedule.windowEnd
            : "09:00"
        }
        title={
          randomWindowSide === "start"
            ? "Window start"
            : randomWindowSide === "end"
              ? "Window end"
              : "Pick a time"
        }
        onCancel={() => setRandomWindowSide(null)}
        onConfirm={(hhmm) => {
          if (draft.schedule.kind === "random" && randomWindowSide) {
            setSchedule({
              ...draft.schedule,
              [randomWindowSide === "start" ? "windowStart" : "windowEnd"]:
                hhmm,
            });
          }
          setRandomWindowSide(null);
        }}
      />
    </Modal>
  );
}

function KindTile({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.kindTile, active && styles.kindTileActive]}
    >
      <Text style={[styles.kindTileText, active && styles.kindTileTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: "92%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
  titleText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  doneText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  doneDisabled: { color: COLORS.textMuted },
  body: { padding: SPACING.lg, paddingBottom: SPACING.xl + 40 },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  } as object,
  miniLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  } as object,
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
  } as object,
  kindRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  kindTile: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  kindTileActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  kindTileText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
  } as object,
  kindTileTextActive: {
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  timeChipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 14,
  } as object,
  addInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  addInlineText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "600",
    fontSize: 13,
  } as object,
  countStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  countValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.accent,
    fontWeight: "700",
    minWidth: 80,
    textAlign: "center",
  } as object,
  adjBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  windowRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  windowCell: {
    flex: 1,
  },
  weekdaysRow: {
    flexDirection: "row",
    gap: 6,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  weekdayChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  weekdayText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
  } as object,
  weekdayTextActive: {
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  linkChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  linkChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  linkChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 13,
  } as object,
  linkChipTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  deleteRow: {
    marginTop: SPACING.xl,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  deleteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.danger,
    fontWeight: "600",
  } as object,
});
