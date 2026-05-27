// ComparePicker — ad-hoc statistical comparison surface that lives inside
// Today's Patterns section (Phase 8 sub-phase 8g).
//
// Lets the user pick any binary treatment + numeric outcome from their
// existing data, then runs the same bootstrap engine experiments use
// (`compareDays` from src/lib/experiments/compare.ts) and renders the
// result with the standardized ComparisonReadout layout.
//
// "What's the effect of Lion's mane on focus?" — exactly this surface.

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import ComparisonReadout from "../experiments/ComparisonReadout";
import { useLogs } from "../../hooks/useLogs";
import { useSettings } from "../../hooks/useSettings";
import { compareDays } from "../../lib/experiments/compare";
import {
  buildCompareGroups,
  listOutcomeOptions,
  listTreatmentOptions,
  type OutcomeOption,
  type TreatmentOption,
} from "../../lib/experiments/adhoc";
import type { ComparisonResult } from "../../types";

interface PickerState {
  treatment?: TreatmentOption;
  outcome?: OutcomeOption;
  result?: ComparisonResult;
  controlSize?: number;
  errorMessage?: string;
}

const MIN_GROUP_SIZE = 1;

export default function ComparePicker() {
  const { recentLogs } = useLogs();
  const { settings } = useSettings();

  const [state, setState] = useState<PickerState>({});
  const [pickerOpen, setPickerOpen] = useState<"treatment" | "outcome" | null>(
    null,
  );

  const eventTypes = settings.eventTypes ?? [];
  const treatmentOptions = useMemo(
    () => listTreatmentOptions(eventTypes),
    [eventTypes],
  );
  const outcomeOptions = useMemo(
    () => listOutcomeOptions(eventTypes),
    [eventTypes],
  );

  const canRun = !!state.treatment && !!state.outcome && recentLogs.length > 0;

  const handleRun = () => {
    if (!state.treatment || !state.outcome) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { control, treatment } = buildCompareGroups(
      recentLogs,
      state.treatment,
      state.outcome,
    );

    if (control.length < MIN_GROUP_SIZE || treatment.length < MIN_GROUP_SIZE) {
      setState((prev) => ({
        ...prev,
        result: undefined,
        controlSize: control.length,
        errorMessage:
          treatment.length < MIN_GROUP_SIZE
            ? "Not enough days with this treatment yet — log a few more, then come back."
            : "Not enough comparison days yet. Log more days without the treatment to enable comparison.",
      }));
      return;
    }

    const result = compareDays(control, treatment);
    setState((prev) => ({
      ...prev,
      result,
      controlSize: control.length,
      errorMessage: undefined,
    }));
  };

  const pickOption = (kind: "treatment" | "outcome", index: number) => {
    Haptics.selectionAsync();
    if (kind === "treatment") {
      setState((prev) => ({
        ...prev,
        treatment: treatmentOptions[index],
        result: undefined,
        errorMessage: undefined,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        outcome: outcomeOptions[index],
        result: undefined,
        errorMessage: undefined,
      }));
    }
    setPickerOpen(null);
  };

  const openOptions =
    pickerOpen === "treatment"
      ? treatmentOptions
      : pickerOpen === "outcome"
        ? outcomeOptions
        : [];

  return (
    <View style={{ marginTop: SPACING.lg }}>
      <SectionLabel label="Compare" />

      <GradientCard>
        <Text style={styles.intro}>
          Pick two things to compare. We'll split your recent days into groups
          and run a bootstrap comparison.
        </Text>

        <TouchableOpacity
          onPress={() => setPickerOpen("treatment")}
          activeOpacity={0.7}
          style={[styles.row, !state.treatment && styles.rowEmpty]}
        >
          <Text style={styles.rowLabel}>Treatment</Text>
          <View style={styles.rowValue}>
            <Text
              style={[
                styles.rowValueText,
                !state.treatment && styles.rowValuePlaceholder,
              ]}
            >
              {state.treatment?.label ?? "Pick a treatment"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPickerOpen("outcome")}
          activeOpacity={0.7}
          style={[styles.row, !state.outcome && styles.rowEmpty]}
        >
          <Text style={styles.rowLabel}>Outcome</Text>
          <View style={styles.rowValue}>
            <Text
              style={[
                styles.rowValueText,
                !state.outcome && styles.rowValuePlaceholder,
              ]}
            >
              {state.outcome?.label ?? "Pick an outcome"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRun}
          activeOpacity={0.85}
          disabled={!canRun}
          style={[styles.runButton, !canRun && styles.runButtonDisabled]}
        >
          <Text style={styles.runButtonText}>
            {state.result ? "Re-run comparison" : "Run comparison"}
          </Text>
        </TouchableOpacity>
      </GradientCard>

      {state.errorMessage ? (
        <GradientCard
          colors={["#2A1515", "#1A0E0E"]}
          style={{ marginTop: SPACING.sm }}
        >
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.danger }]}>
            ⚠️ {state.errorMessage}
          </Text>
        </GradientCard>
      ) : null}

      {state.result && state.treatment && state.outcome ? (
        <ComparisonReadout
          result={state.result}
          treatmentLabel={state.treatment.label}
          outcomeLabel={state.outcome.label}
          controlSize={state.controlSize ?? 0}
          caveat={
            state.result.sampleSize < 7
              ? "Sample size is below the 7-day floor — treat this as exploratory rather than conclusive."
              : undefined
          }
        />
      ) : null}

      {/* Picker modal — shared between treatment + outcome. */}
      <Modal
        visible={pickerOpen !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => setPickerOpen(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerOpen === "treatment"
                  ? "Pick a treatment"
                  : "Pick an outcome"}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(null)} hitSlop={8}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalList}
              keyboardShouldPersistTaps="handled"
            >
              {openOptions.length === 0 ? (
                <Text style={styles.modalEmpty}>
                  {pickerOpen === "treatment"
                    ? "Create a toggle event type or recurrent event in the Log tab to use as a treatment."
                    : "No outcome options available yet."}
                </Text>
              ) : (
                openOptions.map((opt, i) => {
                  const active =
                    pickerOpen === "treatment"
                      ? state.treatment?.label === opt.label
                      : state.outcome?.label === opt.label;
                  return (
                    <TouchableOpacity
                      key={`${i}-${opt.label}`}
                      onPress={() => pickOption(pickerOpen!, i)}
                      activeOpacity={0.7}
                      style={[styles.modalRow, active && styles.modalRowActive]}
                    >
                      <Text
                        style={[
                          styles.modalRowText,
                          active && styles.modalRowTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={COLORS.accent}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 17,
  } as object,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowEmpty: {
    opacity: 0.9,
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  rowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  rowValueText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  } as object,
  rowValuePlaceholder: {
    color: COLORS.textMuted,
  } as object,
  runButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: "center",
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  modalClose: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  modalList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  modalRowActive: {
    backgroundColor: COLORS.accentGlow,
  },
  modalRowText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 14,
    flexShrink: 1,
  } as object,
  modalRowTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  modalEmpty: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    padding: SPACING.lg,
    lineHeight: 18,
  } as object,
});
