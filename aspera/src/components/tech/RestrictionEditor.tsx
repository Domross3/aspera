import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import ContinuousSlider from "../common/ContinuousSlider";
import TimePickerModal from "../settings/TimePickerModal";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { Restriction } from "../../types";
import {
  ALL_WEEKDAYS,
  WEEKDAY_CHIP_LABELS,
  createDefaultRestriction,
  formatSelectionSummary,
  isRestrictionDraftValid,
  normalizeRestrictionForSave,
  restrictionWithKind,
  validateRestrictionDraft,
} from "../../lib/restrictions";

interface Props {
  visible: boolean;
  initial: Restriction | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (restriction: Restriction) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onPickApps?: (restriction: Restriction) => Promise<Restriction>;
}

type TimePickerField = "start" | "end" | null;

export default function RestrictionEditor({
  visible,
  initial,
  saving = false,
  onCancel,
  onSave,
  onDelete,
  onPickApps,
}: Props) {
  const [draft, setDraft] = useState<Restriction>(() =>
    createDefaultRestriction("time_window"),
  );
  const [timePickerField, setTimePickerField] = useState<TimePickerField>(null);
  const [pickingApps, setPickingApps] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(initial ?? createDefaultRestriction("time_window"));
      setTimePickerField(null);
      setPickingApps(false);
    }
  }, [visible, initial]);

  const errors = useMemo(() => validateRestrictionDraft(draft), [draft]);
  const canSave = isRestrictionDraftValid(draft) && !saving;
  const isEditing = Boolean(initial);

  const setKind = (kind: Restriction["spec"]["kind"]) => {
    void Haptics.selectionAsync();
    setDraft((current) => restrictionWithKind(current, kind));
  };

  const toggleWeekday = (day: number) => {
    void Haptics.selectionAsync();
    setDraft((current) => {
      const exists = current.weekdays.includes(day);
      const weekdays = exists
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day].sort((a, b) => a - b);
      return { ...current, weekdays };
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onSave(normalizeRestrictionForSave(draft));
  };

  const handlePickApps = async () => {
    if (!onPickApps || pickingApps) return;
    void Haptics.selectionAsync();
    setPickingApps(true);
    try {
      const next = await onPickApps(draft);
      setDraft(next);
    } catch (error) {
      Alert.alert(
        "App selection failed",
        error instanceof Error ? error.message : "Try again from the editor.",
      );
    } finally {
      setPickingApps(false);
    }
  };

  const handleDelete = () => {
    if (!initial || !onDelete) return;
    Alert.alert("Delete limit?", "This removes the draft app-limit setup.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );
          void onDelete(initial.id);
        },
      },
    ]);
  };

  const pickerInitial =
    draft.spec.kind === "time_window"
      ? timePickerField === "end"
        ? draft.spec.windowEnd
        : draft.spec.windowStart
      : "21:00";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropTouch}
          onPress={onCancel}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity hitSlop={10} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit limit" : "New limit"}
            </Text>
            <TouchableOpacity
              hitSlop={10}
              onPress={() => void handleSave()}
              disabled={!canSave}
            >
              <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) =>
                setDraft((current) => ({ ...current, name }))
              }
              placeholder="Evening social limit"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="done"
            />

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>Mode</Text>
            <View style={styles.segmented}>
              <Segment
                label="Time Window"
                icon="time-outline"
                active={draft.spec.kind === "time_window"}
                onPress={() => setKind("time_window")}
              />
              <Segment
                label="Daily Cap"
                icon="hourglass-outline"
                active={draft.spec.kind === "daily_limit"}
                onPress={() => setKind("daily_limit")}
              />
            </View>

            <View style={styles.activeRow}>
              <View style={styles.activeCopy}>
                <Text style={styles.activeTitle}>Active</Text>
                <Text style={styles.helperText}>
                  Off keeps this as a draft. On starts native enforcement after
                  save.
                </Text>
              </View>
              <Switch
                value={draft.active}
                onValueChange={(active) => {
                  void Haptics.selectionAsync();
                  setDraft((current) => ({ ...current, active }));
                }}
                disabled={saving}
                trackColor={{
                  false: "rgba(255,255,255,0.16)",
                  true: "rgba(108,99,255,0.55)",
                }}
                thumbColor={draft.active ? COLORS.accent : COLORS.textMuted}
              />
            </View>

            {draft.spec.kind === "time_window" ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.label}>Window</Text>
                <View style={styles.timeRow}>
                  <TimeField
                    label="Start"
                    value={draft.spec.windowStart}
                    onPress={() => setTimePickerField("start")}
                  />
                  <TimeField
                    label="End"
                    value={draft.spec.windowEnd}
                    onPress={() => setTimePickerField("end")}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.sectionBlock}>
                <ContinuousSlider
                  label="Daily cap"
                  min={5}
                  max={180}
                  step={5}
                  value={draft.spec.dailyLimitMin}
                  accentColor={COLORS.warning}
                  formatValue={(value) => `${Math.round(value)} min/app`}
                  onChange={(dailyLimitMin) =>
                    setDraft((current) => ({
                      ...current,
                      spec: {
                        kind: "daily_limit",
                        dailyLimitMin,
                      },
                    }))
                  }
                />
              </View>
            )}

            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Days</Text>
              <View style={styles.weekdayRow}>
                {ALL_WEEKDAYS.map((day) => {
                  const selected = draft.weekdays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      activeOpacity={0.8}
                      onPress={() => toggleWeekday(day)}
                      style={[
                        styles.weekdayChip,
                        selected && styles.weekdayChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          selected && styles.weekdayTextSelected,
                        ]}
                      >
                        {WEEKDAY_CHIP_LABELS[day]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>
                Leaving all days off saves as every day.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => void handlePickApps()}
              disabled={!onPickApps || pickingApps}
              style={[
                styles.pickerRow,
                (!onPickApps || pickingApps) && styles.disabled,
              ]}
            >
              <View style={styles.pickerIcon}>
                <Ionicons
                  name="apps-outline"
                  size={18}
                  color={onPickApps ? COLORS.accent : COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerTitle}>
                  {formatSelectionSummary(draft)}
                </Text>
                <Text style={styles.helperText}>
                  {pickingApps
                    ? "Opening Apple's app picker..."
                    : "Choose apps/categories. Aspera only sees counts."}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {errors.length > 0 ? (
              <View style={styles.errorBox}>
                {errors.map((error) => (
                  <Text key={error} style={styles.errorText}>
                    {error}
                  </Text>
                ))}
              </View>
            ) : null}

            {isEditing && onDelete ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDelete}
                disabled={saving}
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={COLORS.danger}
                />
                <Text style={styles.deleteText}>Delete limit</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={timePickerField !== null}
        title={timePickerField === "end" ? "End time" : "Start time"}
        initial={pickerInitial}
        onCancel={() => setTimePickerField(null)}
        onConfirm={(value) => {
          setDraft((current) => {
            if (current.spec.kind !== "time_window") return current;
            return {
              ...current,
              spec: {
                ...current.spec,
                ...(timePickerField === "end"
                  ? { windowEnd: value }
                  : { windowStart: value }),
              },
            };
          });
          setTimePickerField(null);
        }}
      />
    </Modal>
  );
}

function Segment({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? COLORS.text : COLORS.textSecondary}
      />
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TimeField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.timeField}
    >
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },
  backdropTouch: { flex: 1 },
  sheet: {
    maxHeight: "88%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
  headerTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  saveText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "800",
  } as object,
  saveDisabled: {
    color: COLORS.textMuted,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  } as object,
  input: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  } as object,
  segmented: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  segmentActive: {
    backgroundColor: "rgba(108,99,255,0.18)",
    borderColor: COLORS.borderAccent,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "800",
  } as object,
  segmentTextActive: {
    color: COLORS.text,
  },
  sectionBlock: {
    marginTop: SPACING.lg,
  },
  timeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  timeField: {
    flex: 1,
    minHeight: 70,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    justifyContent: "center",
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: 2,
  } as object,
  timeValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
  } as object,
  weekdayRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  weekdayChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  weekdayChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  weekdayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "800",
  } as object,
  weekdayTextSelected: {
    color: COLORS.text,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    lineHeight: 18,
  } as object,
  activeRow: {
    marginTop: SPACING.lg,
    minHeight: 74,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  activeCopy: {
    flex: 1,
    minWidth: 0,
  },
  activeTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "800",
  } as object,
  pickerRow: {
    marginTop: SPACING.lg,
    minHeight: 68,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  errorBox: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(248,113,113,0.25)",
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
  } as object,
  deleteButton: {
    marginTop: SPACING.lg,
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(248,113,113,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  deleteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.danger,
    fontWeight: "800",
  } as object,
});
