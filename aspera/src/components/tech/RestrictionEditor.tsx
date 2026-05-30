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
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
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
import {
  DELAY_MAX_SECONDS,
  DELAY_MIN_SECONDS,
} from "../../lib/gratificationDelay";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? "Edit limit" : "New limit"}
            </Text>
            <TouchableOpacity
              hitSlop={10}
              onPress={() => void handleSave()}
              disabled={!canSave}
            >
              <Text
                style={[
                  styles.saveText,
                  { color: colors.accent },
                  !canSave && { color: colors.textMuted },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Name
            </Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) =>
                setDraft((current) => ({ ...current, name }))
              }
              placeholder="Evening social limit"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="sentences"
              returnKeyType="done"
            />

            <Text
              style={[
                styles.label,
                { color: colors.textMuted, marginTop: SPACING.lg },
              ]}
            >
              Mode
            </Text>
            <View style={styles.segmented}>
              <Segment
                label="Time Window"
                icon="time-outline"
                active={draft.spec.kind === "time_window"}
                onPress={() => setKind("time_window")}
                colors={colors}
              />
              <Segment
                label="Daily Cap"
                icon="hourglass-outline"
                active={draft.spec.kind === "daily_limit"}
                onPress={() => setKind("daily_limit")}
                colors={colors}
              />
              <Segment
                label="Delay"
                icon="leaf-outline"
                active={draft.spec.kind === "delay"}
                onPress={() => setKind("delay")}
                colors={colors}
              />
            </View>

            <View style={styles.activeRow}>
              <View style={styles.activeCopy}>
                <Text style={[styles.activeTitle, { color: colors.text }]}>
                  Active
                </Text>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
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
                thumbColor={draft.active ? colors.accent : colors.textMuted}
              />
            </View>

            {draft.spec.kind === "time_window" ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Window
                </Text>
                <View style={styles.timeRow}>
                  <TimeField
                    label="Start"
                    value={draft.spec.windowStart}
                    onPress={() => setTimePickerField("start")}
                    colors={colors}
                  />
                  <TimeField
                    label="End"
                    value={draft.spec.windowEnd}
                    onPress={() => setTimePickerField("end")}
                    colors={colors}
                  />
                </View>
              </View>
            ) : draft.spec.kind === "daily_limit" ? (
              <View style={styles.sectionBlock}>
                <ContinuousSlider
                  label="Daily cap"
                  min={5}
                  max={180}
                  step={5}
                  value={draft.spec.dailyLimitMin}
                  accentColor={colors.warning}
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
            ) : (
              <View style={styles.sectionBlock}>
                <ContinuousSlider
                  label="Pause before opening"
                  min={DELAY_MIN_SECONDS}
                  max={DELAY_MAX_SECONDS}
                  step={5}
                  value={draft.spec.delaySeconds}
                  accentColor={colors.accent}
                  formatValue={(value) => `${Math.round(value)}s`}
                  onChange={(delaySeconds) =>
                    setDraft((current) => ({
                      ...current,
                      spec: {
                        kind: "delay",
                        delaySeconds: Math.round(delaySeconds),
                      },
                    }))
                  }
                />
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Each time you open these apps, take a calm pause first. Always
                  available — the wait is the friction.
                </Text>
              </View>
            )}

            <View style={styles.sectionBlock}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Days
              </Text>
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
                        selected && {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          { color: colors.textSecondary },
                          selected && { color: colors.text },
                        ]}
                      >
                        {WEEKDAY_CHIP_LABELS[day]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
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
                  color={onPickApps ? colors.accent : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {formatSelectionSummary(draft)}
                </Text>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  {pickingApps
                    ? "Opening Apple's app picker..."
                    : "Choose apps/categories. Aspera only sees counts."}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {errors.length > 0 ? (
              <View style={styles.errorBox}>
                {errors.map((error) => (
                  <Text
                    key={error}
                    style={[styles.errorText, { color: colors.danger }]}
                  >
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
                  color={colors.danger}
                />
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  Delete limit
                </Text>
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
  colors,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  colors: AsperaColors;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        segmentStyles.segment,
        {
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        },
        active && {
          backgroundColor: "rgba(108,99,255,0.18)",
          borderColor: colors.borderAccent,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? colors.text : colors.textSecondary}
      />
      <Text
        style={[
          segmentStyles.segmentText,
          { color: colors.textSecondary },
          active && { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TimeField({
  label,
  value,
  onPress,
  colors,
}: {
  label: string;
  value: string;
  onPress: () => void;
  colors: AsperaColors;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        timeFieldStyles.timeField,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[timeFieldStyles.timeLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[timeFieldStyles.timeValue, { color: colors.text }]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

const segmentStyles = StyleSheet.create({
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
  } as object,
});

const timeFieldStyles = StyleSheet.create({
  timeField: {
    flex: 1,
    minHeight: 70,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    justifyContent: "center",
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: 2,
  } as object,
  timeValue: {
    ...TYPOGRAPHY.title,
  } as object,
});

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      justifyContent: "flex-end",
    },
    backdropTouch: { flex: 1 },
    sheet: {
      maxHeight: "88%",
      backgroundColor: c.surface,
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
      borderBottomColor: c.border,
    },
    cancelText: {
      ...TYPOGRAPHY.body,
    } as object,
    headerTitle: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    saveText: {
      ...TYPOGRAPHY.body,
      fontWeight: "800",
    } as object,
    disabled: {
      opacity: 0.55,
    },
    content: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    label: {
      ...TYPOGRAPHY.label,
      marginBottom: SPACING.sm,
    } as object,
    input: {
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      ...TYPOGRAPHY.body,
    } as object,
    segmented: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    sectionBlock: {
      marginTop: SPACING.lg,
    },
    timeRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
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
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    weekdayText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "800",
    } as object,
    helperText: {
      ...TYPOGRAPHY.caption,
      lineHeight: 18,
    } as object,
    activeRow: {
      marginTop: SPACING.lg,
      minHeight: 74,
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
      fontWeight: "800",
    } as object,
    pickerRow: {
      marginTop: SPACING.lg,
      minHeight: 68,
      borderRadius: RADIUS.lg,
      backgroundColor: "rgba(255,255,255,0.035)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    pickerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    pickerTitle: {
      ...TYPOGRAPHY.body,
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
      fontWeight: "800",
    } as object,
  });
