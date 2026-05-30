// SubstitutionCard — surfaces Engine B (substitution / filler analysis) on
// the Today screen once there's enough screen-time history to say something
// meaningful. Stays silent below the 7-day warmup and when no pattern cleared
// the heuristic floors — the same discipline as AgentFindingsCard.

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";
import { useScreenTime } from "../../hooks/useScreenTime";
import { analyzeSubstitution } from "../../lib/screenTime/substitution";
import { SCREEN_TIME_CATEGORY_LABELS } from "../../lib/screenTime/categories";
import type { ScreenTimeCategory } from "../../lib/screenTime/constants";

function categoryLabel(cat: ScreenTimeCategory): string {
  return SCREEN_TIME_CATEGORY_LABELS[cat] ?? cat;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    panel: {
      borderRadius: RADIUS.instrument,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 20,
      marginTop: SPACING.md,
    },
    panelHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    label: {
      ...TYPOGRAPHY.aspLabel,
      letterSpacing: 1.98,
      color: c.textMuted,
    } as object,
    tentative: {
      ...TYPOGRAPHY.aspLabel,
      letterSpacing: 1.1,
      color: c.faint,
    } as object,
    list: { gap: SPACING.md },
    bodyText: {
      ...TYPOGRAPHY.body,
      fontSize: 17,
      lineHeight: 25.5,
      color: c.text,
    } as object,
    footnote: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontStyle: "italic",
    } as object,
  });

export default function SubstitutionCard() {
  const { dailyTotals } = useScreenTime();
  const styles = useThemedStyles(makeStyles);

  const analysis = useMemo(
    () => analyzeSubstitution(dailyTotals),
    [dailyTotals],
  );

  const { daysAnalyzed, topFiller, topSubstitution } = analysis;

  // Stay silent until warmed up or if neither engine returned a credible pattern.
  if (daysAnalyzed < 7 || (topFiller === null && topSubstitution === null)) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.label}>Pattern</Text>
        <Text style={styles.tentative}>tentative</Text>
      </View>
      <View style={styles.list}>
        {topFiller !== null && (
          <Text style={styles.bodyText}>
            {categoryLabel(topFiller.category)} tends to absorb the time you
            pull back from other apps.
          </Text>
        )}
        {topSubstitution !== null && (
          <Text style={styles.bodyText}>
            When {categoryLabel(topSubstitution.a)} drops,{" "}
            {categoryLabel(topSubstitution.b)} tends to rise.
          </Text>
        )}
        <Text style={styles.footnote}>
          From your own screen-time history — worth noticing, not proven.
        </Text>
      </View>
    </View>
  );
}
