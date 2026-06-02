import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import type { SearchResponse, ConfidenceLevel } from "../../types/search";
import { executeSearch, clearSearchCache } from "../../lib/searchOrchestrator";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: COLORS.success,
  medium: COLORS.warning,
  low: COLORS.danger,
};

const EXAMPLE_QUERIES = [
  "Do I focus better after yoga?",
  "How does sleep affect my energy?",
  "Best days for deep work?",
];

// SearchBar no longer takes an apiKey — Claude calls go through
// /api/mobile/claude on the server (see claudeProxy.ts).
type Props = Record<string, never>;

export default function SearchBar(_props: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q || loading) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await executeSearch({ query: q });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (response.sampleSize === 0) {
        setError(response.answer);
      } else {
        setResult(response);
      }
    } catch {
      // Search runs through the Claude proxy, which can be unreachable. Be
      // honest about connectivity rather than a generic failure.
      setError(
        "I couldn't reach the analysis service just now — check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuery("");
    setResult(null);
    setError(null);
  };

  const handleFollowUp = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.inputRow}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Ask about your patterns..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          editable={!loading}
          multiline
          blurOnSubmit
          textAlignVertical="top"
        />
        {query.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="small" color={COLORS.accent} />}
      </View>

      {/* Example chips — only when idle with no query */}
      {!query && !result && !error && !loading && (
        <View style={styles.chipRow}>
          {EXAMPLE_QUERIES.map((eq) => (
            <TouchableOpacity
              key={eq}
              style={styles.chip}
              onPress={() => handleFollowUp(eq)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{eq}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Error */}
      {error && (
        <GradientCard colors={["#2A1515", "#1A0E0E"]} style={styles.resultCard}>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.danger }]}>
            {error}
          </Text>
        </GradientCard>
      )}

      {/* Result */}
      {result && (
        <GradientCard style={styles.resultCard}>
          {/* Answer */}
          <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
            {result.answer}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: CONFIDENCE_COLORS[result.confidence] + "22",
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: CONFIDENCE_COLORS[result.confidence] },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: CONFIDENCE_COLORS[result.confidence] },
                ]}
              >
                {result.confidence} confidence
              </Text>
            </View>
            <Text style={styles.metaText}>
              {result.sampleSize} day{result.sampleSize !== 1 ? "s" : ""}{" "}
              analyzed
            </Text>
          </View>

          {/* Confounds */}
          {result.confounds.length > 0 && (
            <View style={styles.confoundsBox}>
              <Text
                style={[
                  TYPOGRAPHY.label,
                  { color: COLORS.textMuted, marginBottom: SPACING.xs },
                ]}
              >
                CAVEATS
              </Text>
              {result.confounds.map((c, i) => (
                <View key={i} style={styles.confoundItem}>
                  <Text style={styles.confoundText}>
                    {c.impact === "major"
                      ? "!!"
                      : c.impact === "moderate"
                        ? "!"
                        : "-"}{" "}
                    {c.factor}
                  </Text>
                  {c.explanation && (
                    <Text style={styles.confoundExplanation}>
                      {c.explanation}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Follow-ups */}
          {result.followUpQuestions.length > 0 && (
            <View style={styles.followUpBox}>
              <Text
                style={[
                  TYPOGRAPHY.label,
                  { color: COLORS.textMuted, marginBottom: SPACING.xs },
                ]}
              >
                DIG DEEPER
              </Text>
              {result.followUpQuestions.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleFollowUp(q)}
                  activeOpacity={0.7}
                  style={styles.followUpChip}
                >
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.followUpText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GradientCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 48,
    gap: SPACING.sm,
  },
  searchIcon: {
    marginRight: 2,
    marginTop: 2,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    padding: 0,
  } as object,
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    backgroundColor: COLORS.accentGlow,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 11,
  } as object,
  resultCard: {
    marginTop: SPACING.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "600",
  } as object,
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  confoundsBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  confoundItem: {
    marginBottom: SPACING.xs,
  },
  confoundText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  } as object,
  confoundExplanation: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 14,
    marginTop: 2,
  } as object,
  followUpBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  followUpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  followUpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 12,
  } as object,
});
