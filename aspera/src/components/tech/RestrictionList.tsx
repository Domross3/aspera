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
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import type { Restriction } from "../../types";
import {
  formatRestrictionMode,
  formatRestrictionSchedule,
  formatSelectionSummary,
  formatWeekdays,
} from "../../lib/restrictions";

interface Props {
  restrictions: Restriction[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onCreate: () => void;
  onEdit: (restriction: Restriction) => void;
  onRefresh?: () => void;
}

export default function RestrictionList({
  restrictions,
  loading = false,
  saving = false,
  error = null,
  onCreate,
  onEdit,
  onRefresh,
}: Props) {
  if (loading && restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={COLORS.accent} size="small" />
          <Text style={styles.mutedText}>Loading app limits...</Text>
        </View>
      </GradientCard>
    );
  }

  if (error && restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <Text style={styles.title}>Could not load app limits</Text>
        <Text style={[styles.mutedText, { marginTop: SPACING.xs }]}>
          {error}
        </Text>
        {onRefresh ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefresh}
            style={styles.secondaryButton}
          >
            <Ionicons name="refresh" size={16} color={COLORS.accent} />
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </GradientCard>
    );
  }

  if (restrictions.length === 0) {
    return (
      <GradientCard style={styles.cardSpacing}>
        <View style={styles.emptyIcon}>
          <Ionicons name="timer-outline" size={24} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>No app limits yet</Text>
        <Text style={[styles.mutedText, { marginTop: SPACING.xs }]}>
          Draft a time window or daily cap now. App selection and enforcement
          arrive in the next native shield build.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCreate}
          disabled={saving}
          style={[styles.primaryButton, saving && styles.disabled]}
        >
          <Ionicons name="add" size={18} color={COLORS.text} />
          <Text style={styles.primaryButtonText}>New limit</Text>
        </TouchableOpacity>
      </GradientCard>
    );
  }

  return (
    <View style={styles.cardSpacing}>
      <View style={styles.headerRow}>
        <Text style={styles.countText}>
          {restrictions.length} draft{restrictions.length === 1 ? "" : "s"}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCreate}
          disabled={saving}
          style={[styles.compactButton, saving && styles.disabled]}
        >
          <Ionicons name="add" size={16} color={COLORS.text} />
          <Text style={styles.compactButtonText}>New limit</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {restrictions.map((restriction) => (
        <TouchableOpacity
          key={restriction.id}
          activeOpacity={0.84}
          onPress={() => onEdit(restriction)}
          style={styles.rowCard}
        >
          <View style={styles.rowTop}>
            <View style={styles.rowTitleWrap}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {restriction.name}
              </Text>
              <Text style={styles.modeText}>
                {formatRestrictionMode(restriction)}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Draft</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <Detail icon="time-outline" label={formatRestrictionSchedule(restriction)} />
            <Detail icon="calendar-outline" label={formatWeekdays(restriction.weekdays)} />
            <Detail
              icon="apps-outline"
              label={formatSelectionSummary(restriction)}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Detail({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.detailPill}>
      <Ionicons name={icon} size={14} color={COLORS.textSecondary} />
      <Text style={styles.detailText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.text,
  } as object,
  mutedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    lineHeight: 18,
  } as object,
  primaryButton: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.xs,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
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
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
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
    color: COLORS.textMuted,
    textTransform: "uppercase",
  } as object,
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  compactButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "800",
  } as object,
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  } as object,
  rowCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
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
    color: COLORS.text,
  } as object,
  modeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  } as object,
  badge: {
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderAccent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: "rgba(108,99,255,0.12)",
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "800",
  } as object,
  detailGrid: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
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
    color: COLORS.textSecondary,
    flex: 1,
  } as object,
});
