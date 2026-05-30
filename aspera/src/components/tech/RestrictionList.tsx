import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GradientCard from "../common/GradientCard";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { Restriction } from "../../types";
import {
  formatRestrictionMode,
  formatRestrictionSchedule,
  formatSelectionSummary,
  formatWeekdays,
} from "../../lib/restrictions";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  restrictions: Restriction[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onCreate: () => void;
  onEdit: (restriction: Restriction) => void;
  onCheat?: (restriction: Restriction) => void;
  onRefresh?: () => void;
}

export default function RestrictionList({
  restrictions,
  loading = false,
  saving = false,
  error = null,
  onCreate,
  onEdit,
  onCheat,
  onRefresh,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (loading && restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={[styles.mutedText, { color: colors.textMuted }]}>
            Loading app limits...
          </Text>
        </View>
      </GradientCard>
    );
  }

  if (error && restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <Text style={[styles.title, { color: colors.text }]}>
          Could not load app limits
        </Text>
        <Text
          style={[
            styles.mutedText,
            { color: colors.textMuted, marginTop: SPACING.xs },
          ]}
        >
          {error}
        </Text>
        {onRefresh ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefresh}
            style={styles.secondaryButton}
          >
            <Ionicons name="refresh" size={16} color={colors.accent} />
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
              Retry
            </Text>
          </TouchableOpacity>
        ) : null}
      </GradientCard>
    );
  }

  if (restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <View style={styles.emptyIcon}>
          <Ionicons name="timer-outline" size={24} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          No app limits yet
        </Text>
        <Text
          style={[
            styles.mutedText,
            { color: colors.textMuted, marginTop: SPACING.xs },
          ]}
        >
          Draft a time window or daily cap, choose apps, then activate it when
          you want Aspera to enforce the boundary.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCreate}
          disabled={saving}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.accent },
            saving && styles.disabled,
          ]}
        >
          <Ionicons name="add" size={18} color={colors.text} />
          <Text style={[styles.primaryButtonText, { color: colors.text }]}>
            New limit
          </Text>
        </TouchableOpacity>
      </GradientCard>
    );
  }

  return (
    <View style={styles.cardSpacing}>
      <View style={styles.headerRow}>
        <Text style={[styles.countText, { color: colors.textMuted }]}>
          {restrictions.length} draft{restrictions.length === 1 ? "" : "s"}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCreate}
          disabled={saving}
          style={[
            styles.compactButton,
            { backgroundColor: colors.accent },
            saving && styles.disabled,
          ]}
        >
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={[styles.compactButtonText, { color: colors.text }]}>
            New limit
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : null}

      {restrictions.map((restriction) => (
        <TouchableOpacity
          key={restriction.id}
          activeOpacity={0.84}
          onPress={() => onEdit(restriction)}
          style={[
            styles.rowCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.rowTop}>
            <View style={styles.rowTitleWrap}>
              <Text
                style={[styles.rowTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {restriction.name}
              </Text>
              <Text style={[styles.modeText, { color: colors.textSecondary }]}>
                {formatRestrictionMode(restriction)}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                restriction.active && styles.activeBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: colors.accent },
                  restriction.active && { color: colors.success },
                ]}
              >
                {restriction.active ? "Active" : "Draft"}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <Detail
              icon="time-outline"
              label={formatRestrictionSchedule(restriction)}
              colors={colors}
            />
            <Detail
              icon="calendar-outline"
              label={formatWeekdays(restriction.weekdays)}
              colors={colors}
            />
            <Detail
              icon="apps-outline"
              label={formatSelectionSummary(restriction)}
              colors={colors}
            />
          </View>

          {restriction.active && onCheat ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCheat(restriction)}
              disabled={saving}
              style={styles.cheatButton}
            >
              <Ionicons
                name={
                  restriction.spec.kind === "delay"
                    ? "leaf-outline"
                    : "key-outline"
                }
                size={15}
                color={colors.warning}
              />
              <Text style={[styles.cheatButtonText, { color: colors.warning }]}>
                {restriction.spec.kind === "delay"
                  ? "Take a pause"
                  : "Use cheat"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Detail({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: AsperaColors;
}) {
  return (
    <View style={detailStyles.detailPill}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text
        style={[detailStyles.detailText, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  detailPill: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: SPACING.sm,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
  } as object,
});

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    cardSpacing: { marginBottom: SPACING.md },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    emptyIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(108,99,255,0.12)",
      marginBottom: SPACING.md,
    },
    title: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    mutedText: {
      ...TYPOGRAPHY.caption,
      lineHeight: 18,
    } as object,
    primaryButton: {
      marginTop: SPACING.md,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: SPACING.xs,
    },
    primaryButtonText: {
      ...TYPOGRAPHY.body,
      fontWeight: "700",
    } as object,
    secondaryButton: {
      marginTop: SPACING.md,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderRadius: RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    secondaryButtonText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "700",
    } as object,
    disabled: { opacity: 0.55 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.sm,
    },
    countText: {
      ...TYPOGRAPHY.caption,
      textTransform: "uppercase",
    } as object,
    compactButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    compactButtonText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "800",
    } as object,
    errorText: {
      ...TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    } as object,
    rowCard: {
      borderRadius: RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: SPACING.md,
    },
    rowTitleWrap: { flex: 1, minWidth: 0 },
    rowTitle: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    modeText: {
      ...TYPOGRAPHY.caption,
      marginTop: 2,
    } as object,
    badge: {
      borderRadius: RADIUS.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderAccent,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      backgroundColor: "rgba(108,99,255,0.12)",
    },
    badgeText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "800",
    } as object,
    activeBadge: {
      borderColor: "rgba(34,197,94,0.45)",
      backgroundColor: "rgba(34,197,94,0.12)",
    },
    detailGrid: {
      marginTop: SPACING.md,
      gap: SPACING.xs,
    },
    cheatButton: {
      marginTop: SPACING.sm,
      minHeight: 34,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderRadius: RADIUS.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(251,191,36,0.35)",
      backgroundColor: "rgba(251,191,36,0.09)",
      paddingHorizontal: SPACING.sm,
    },
    cheatButtonText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "800",
    } as object,
  });
