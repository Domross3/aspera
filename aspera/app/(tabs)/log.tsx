import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useLogs } from "../../src/hooks/useLogs";
import { useSettings } from "../../src/hooks/useSettings";
import {
  DailyLog,
  EventEntry,
  EventTypeDef,
  LogSectionId,
  LOG_SECTIONS,
  DEFAULT_LOG_SECTION_ORDER,
  MusicGenre,
} from "../../src/types";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import CaffeinePicker from "../../src/components/log/CaffeinePicker";
import WorkoutSelector from "../../src/components/log/WorkoutSelector";
import IntensitySlider from "../../src/components/log/IntensitySlider";
import MusicChips from "../../src/components/log/MusicChips";
import NutritionInput from "../../src/components/log/NutritionInput";
import RatingSlider from "../../src/components/log/RatingSlider";
import CustomTags from "../../src/components/log/CustomTags";
import DrinksInput from "../../src/components/log/DrinksInput";
import SleepInput from "../../src/components/log/SleepInput";
import DaylightInput from "../../src/components/log/DaylightInput";
import EveningReflection from "../../src/components/log/EveningReflection";
import EventTypeRenderer from "../../src/components/log/EventTypeRenderer";
import SchemaBuilder from "../../src/components/log/SchemaBuilder";
import WeekStrip from "../../src/components/log/WeekStrip";
import { reorderSection, toggleSection } from "../../src/lib/logSections";
import { asperaDayId } from "../../src/lib/day";
import { clearInsights } from "../../src/storage/storage";

// ── Section descriptors + ordering ───────────────────────────────────────

// What the Log tab is currently rendering, in order. System sections map
// to bespoke widgets (Sleep, Caffeine, etc.); user sections render via
// the schema-driven EventTypeRenderer. Edit mode operates on this list.
type SectionDescriptor =
  | { kind: "system"; id: LogSectionId; label: string }
  | { kind: "user"; type: EventTypeDef };

function buildSections(
  order: (LogSectionId | string)[] | undefined,
  hidden: (LogSectionId | string)[],
  eventTypes: EventTypeDef[],
): SectionDescriptor[] {
  // Default order if the user has never customized it.
  const base: (LogSectionId | string)[] =
    order && order.length > 0
      ? [...order]
      : [...DEFAULT_LOG_SECTION_ORDER, ...eventTypes.map((t) => t.id)];

  // Append anything the saved order doesn't know about — handles two
  // cases gracefully: a new system section landing in an app update, and
  // a user creating a new event type that hasn't been merged into their
  // saved order yet.
  const known = new Set(base);
  for (const sysId of DEFAULT_LOG_SECTION_ORDER) {
    if (!known.has(sysId)) {
      base.push(sysId);
      known.add(sysId);
    }
  }
  for (const t of eventTypes) {
    if (!known.has(t.id)) {
      base.push(t.id);
      known.add(t.id);
    }
  }

  const sysById = new Map(LOG_SECTIONS.map((s) => [s.id, s]));
  const userById = new Map(eventTypes.map((t) => [t.id, t]));

  const ordered = base
    .filter((id) => !hidden.includes(id))
    .map<SectionDescriptor | null>((id) => {
      const sys = sysById.get(id as LogSectionId);
      if (sys) return { kind: "system", id: sys.id, label: sys.label };
      const userType = userById.get(id);
      if (userType) return { kind: "user", type: userType };
      // Unknown id (stale order entry referencing a deleted event type).
      return null;
    })
    .filter((d): d is SectionDescriptor => d !== null);

  // Hoist recurrent event types to the very top so multiply-occurring things
  // (workout, dose, etc.) are the first thing the user sees + logs — above
  // the Evening Reflection — rather than buried under a dozen system
  // sections. Single-cardinality user types keep their place in the order.
  // Stable partition preserves relative ordering within each group.
  const recurrent = ordered.filter(
    (d) => d.kind === "user" && d.type.cardinality === "recurrent",
  );
  const rest = ordered.filter(
    (d) => !(d.kind === "user" && d.type.cardinality === "recurrent"),
  );
  return [...recurrent, ...rest];
}

// ── Default values + helpers ─────────────────────────────────────────────

function todayId(): string {
  return asperaDayId();
}

// Today's draft — friendly pre-fills so a user opening a fresh app can
// adjust rather than start from zero. We keep these even though they're
// somewhat "opinionated" because most users do have caffeine + ambient
// music + a meal, and adjusting is faster than typing from scratch.
function defaultLog(): DailyLog {
  const id = todayId();
  return {
    id,
    date: id,
    createdAt: Date.now(),
    caffeine: { type: "espresso", amount: 150 },
    workout: { type: "none", intensity: 0 },
    music: ["lofi"],
    nutrition: { mealQuality: 3, hydration: 6 },
    output: { tasksCompleted: 5, focusRating: 3, energyRating: 3 },
    tags: [],
    bigRocks: [],
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
    eventEntries: [],
  };
}

// Empty shell for a past day with no existing log. Differs from
// `defaultLog` in that nothing is pre-filled — we don't want to invent
// "you had espresso last Tuesday" out of thin air when the user is
// backfilling. Caller is responsible for `id`/`date`.
function blankLog(date: string): DailyLog {
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
  };
}

// ── LogScreen ────────────────────────────────────────────────────────────

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayLog, save, getLogFor } = useLogs();
  const { settings, update: updateSettings } = useSettings();

  const [selectedDate, setSelectedDate] = useState<string>(todayId());
  const isToday = selectedDate === todayId();
  const isPastDay = !isToday;

  const [form, setForm] = useState<DailyLog>(defaultLog);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // SchemaBuilder state. `"__new__"` is a sentinel for "creating a new
  // type"; a real EventTypeDef.id puts the builder into edit-mode.
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  // Load the right log into the form whenever the selected date changes.
  // For today this just follows the live `todayLog` from useLogs. For
  // past days we hit getLogFor (cloud → cache fallback) and render blank
  // if nothing was ever saved for that day. Critical: blank past-day
  // form so a transient visit doesn't accidentally save defaults like
  // "espresso 150mg" for a day the user didn't actually log.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isToday) {
        setForm(todayLog ?? defaultLog());
        return;
      }
      const existing = await getLogFor(selectedDate);
      if (cancelled) return;
      setForm(existing ?? blankLog(selectedDate));
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, isToday, todayLog, getLogFor]);

  const patch = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Saving from the Log tab means the user has reviewed Performance Output,
    // so the day's focus/energy/tasks count as a real rating from here on.
    const log: DailyLog = { ...form, createdAt: Date.now(), outputRated: true };
    await save(log);
    // Retroactive edits invalidate the insights cache so the next Insights
    // view regenerates against the corrected history. Today-day saves
    // don't need this — insights regenerate naturally on the next call.
    if (isPastDay) {
      await clearInsights();
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Compute the visible section list. Memoize because edit-mode operations
  // re-render the list every change.
  const eventTypes = settings.eventTypes ?? [];
  const sections = useMemo(
    () =>
      buildSections(
        settings.logSectionOrder,
        settings.hiddenLogSections,
        eventTypes,
      ),
    [settings.logSectionOrder, settings.hiddenLogSections, eventTypes],
  );

  // ── Edit-mode helpers ─────────────────────────────────────────────────

  const persistOrder = (next: (LogSectionId | string)[]) => {
    void updateSettings({ logSectionOrder: next });
  };

  const hideSection = (id: LogSectionId | string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void updateSettings({
      hiddenLogSections: toggleSection(settings.hiddenLogSections, id),
    });
  };

  // Per-field hiding within multi-field system sections (e.g. dropping
  // "Tasks Completed" from Performance Output). Keyed by dotted path.
  const hiddenSystemFields = settings.hiddenSystemFields ?? [];
  const isFieldHidden = (key: string) => hiddenSystemFields.includes(key);
  const toggleFieldHidden = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = hiddenSystemFields.includes(key)
      ? hiddenSystemFields.filter((k) => k !== key)
      : [...hiddenSystemFields, key];
    void updateSettings({ hiddenSystemFields: next });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    // Build the ordering as the user currently sees it, including the
    // implicit fall-through for sections not yet in `logSectionOrder`.
    const visibleIds = sections.map((s) =>
      s.kind === "system" ? s.id : s.type.id,
    );
    const next = reorderSection(visibleIds, index, index + direction);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persistOrder(next);
  };

  const removeEventType = (typeId: string) => {
    // Remove from settings + clear all of its entries from today's draft.
    // Historical logs on disk keep their entries; the renderer just won't
    // surface them (the type no longer exists, so they're orphaned). That
    // matches the SchemaBuilder's delete-confirm copy.
    void updateSettings({
      eventTypes: (settings.eventTypes ?? []).filter((t) => t.id !== typeId),
      logSectionOrder: (settings.logSectionOrder ?? []).filter(
        (id) => id !== typeId,
      ),
      hiddenLogSections: settings.hiddenLogSections.filter(
        (id) => id !== typeId,
      ),
    });
    setForm((prev) => ({
      ...prev,
      eventEntries: (prev.eventEntries ?? []).filter(
        (e) => e.typeId !== typeId,
      ),
    }));
  };

  // ── SchemaBuilder integration ─────────────────────────────────────────

  const schemaBuilderInitial =
    editingTypeId && editingTypeId !== "__new__"
      ? ((settings.eventTypes ?? []).find((t) => t.id === editingTypeId) ??
        null)
      : null;

  // Identify field ids that have stored values across all of today's
  // entries for this type. Historical logs aren't loaded here, so we err
  // toward "unlocked" — Phase 4 retroactive logging plugs in a more
  // complete check. For v1 this is a usable signal.
  const fieldsWithData = useMemo(() => {
    if (!editingTypeId || editingTypeId === "__new__") return new Set<string>();
    const ids = new Set<string>();
    for (const e of form.eventEntries ?? []) {
      if (e.typeId !== editingTypeId) continue;
      for (const fid of Object.keys(e.fieldValues ?? {})) ids.add(fid);
    }
    return ids;
  }, [editingTypeId, form.eventEntries]);

  const typeHasEntries = useMemo(() => {
    if (!editingTypeId || editingTypeId === "__new__") return false;
    return (form.eventEntries ?? []).some((e) => e.typeId === editingTypeId);
  }, [editingTypeId, form.eventEntries]);

  const handleSchemaSave = (next: EventTypeDef) => {
    const existing = settings.eventTypes ?? [];
    const known = existing.some((t) => t.id === next.id);
    const nextTypes = known
      ? existing.map((t) => (t.id === next.id ? next : t))
      : [...existing, next];

    void updateSettings({ eventTypes: nextTypes });

    // For new types, slot the id into the order at the end if it's not
    // already in there.
    if (!known) {
      const baseOrder = settings.logSectionOrder ?? [
        ...DEFAULT_LOG_SECTION_ORDER,
      ];
      if (!baseOrder.includes(next.id)) {
        persistOrder([...baseOrder, next.id]);
      }
    }
    setEditingTypeId(null);
  };

  const handleSchemaDelete = () => {
    if (!editingTypeId || editingTypeId === "__new__") return;
    removeEventType(editingTypeId);
    setEditingTypeId(null);
  };

  // ── Section content renderers ─────────────────────────────────────────

  const renderSystemContent = (id: LogSectionId): React.ReactElement | null => {
    switch (id) {
      case "eveningReflection":
        return (
          <EveningReflection
            bigRocks={form.bigRocks ?? []}
            outcomes={form.bigRockOutcomes}
            reflectionNote={form.reflectionNote}
            onChange={({ outcomes, reflectionNote }) =>
              setForm((prev) => ({
                ...prev,
                bigRockOutcomes: outcomes,
                reflectionNote,
              }))
            }
          />
        );
      case "bigRocks":
        return (
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)" as never)}
            activeOpacity={0.8}
          >
            <GradientCard style={{ marginBottom: 0 }}>
              {form.bigRocks && form.bigRocks.length > 0 ? (
                <>
                  {form.bigRocks.map((rock, i) => (
                    <View key={i} style={logStyles.rockRow}>
                      <View style={logStyles.rockBadge}>
                        <Text style={logStyles.rockBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={logStyles.rockText}>{rock}</Text>
                    </View>
                  ))}
                  <View style={logStyles.editLinkRow}>
                    <Text style={logStyles.editLinkText}>Edit on Today</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.accent}
                    />
                  </View>
                </>
              ) : (
                <View style={logStyles.editLinkRow}>
                  <Text style={logStyles.editLinkText}>
                    Set today's focus on the Today tab
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.accent}
                  />
                </View>
              )}
            </GradientCard>
          </TouchableOpacity>
        );
      case "sleep":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <SleepInput
              value={form.sleepHours ?? 0}
              onChange={(v) => patch("sleepHours", v)}
            />
          </GradientCard>
        );
      case "daylight":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <DaylightInput
              value={form.daylightMinutes ?? 0}
              onChange={(v) => patch("daylightMinutes", v)}
            />
          </GradientCard>
        );
      case "caffeine":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <CaffeinePicker
              value={form.caffeine.type}
              amount={form.caffeine.amount}
              onChange={(type, amount) => patch("caffeine", { type, amount })}
            />
          </GradientCard>
        );
      case "workout":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <WorkoutSelector
              value={form.workout.type}
              onChange={(type) =>
                patch("workout", {
                  type,
                  intensity:
                    type === "none" ? 0 : Math.max(1, form.workout.intensity),
                })
              }
            />
            {form.workout.type !== ("none" as string) && (
              <View style={{ marginTop: SPACING.md }}>
                <Text
                  style={[
                    TYPOGRAPHY.caption,
                    { color: COLORS.textMuted, marginBottom: SPACING.sm },
                  ]}
                >
                  INTENSITY
                </Text>
                <IntensitySlider
                  value={form.workout.intensity || 5}
                  onChange={(intensity) =>
                    patch("workout", { ...form.workout, intensity })
                  }
                />
              </View>
            )}
          </GradientCard>
        );
      case "music":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <MusicChips
              selected={form.music}
              onChange={(music) => patch("music", music as MusicGenre[])}
            />
          </GradientCard>
        );
      case "nutrition":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <NutritionInput
              mealQuality={form.nutrition.mealQuality}
              hydration={form.nutrition.hydration}
              onChangeMeal={(q) =>
                patch("nutrition", { ...form.nutrition, mealQuality: q })
              }
              onChangeHydration={(h) =>
                patch("nutrition", { ...form.nutrition, hydration: h })
              }
            />
          </GradientCard>
        );
      case "drinks":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <DrinksInput
              value={form.drinks ?? 0}
              onChange={(v) => patch("drinks", v)}
            />
          </GradientCard>
        );
      case "output": {
        // Each sub-field can be hidden via edit mode. Outside edit mode a
        // hidden field renders nothing; inside edit mode it stays visible
        // (dimmed) with a toggle so the user can bring it back.
        const renderOutputField = (
          key: string,
          node: React.ReactElement,
        ): React.ReactElement | null => {
          const hidden = isFieldHidden(key);
          if (hidden && !editMode) return null;
          return (
            <View key={key} style={hidden ? { opacity: 0.4 } : undefined}>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => toggleFieldHidden(key)}
                  hitSlop={6}
                  style={styles.fieldHideToggle}
                >
                  <Ionicons
                    name={hidden ? "eye-off" : "remove-circle"}
                    size={14}
                    color={hidden ? COLORS.textMuted : COLORS.danger}
                  />
                  <Text style={styles.fieldHideText}>
                    {hidden ? "Hidden — tap to show" : "Hide this field"}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {node}
            </View>
          );
        };
        return (
          <GradientCard style={{ marginBottom: 0, gap: SPACING.lg }}>
            {renderOutputField(
              "output.focusRating",
              <RatingSlider
                label="Focus Rating"
                value={form.output.focusRating}
                onChange={(v) =>
                  patch("output", { ...form.output, focusRating: v })
                }
                accentColor={COLORS.accent}
              />,
            )}
            {renderOutputField(
              "output.energyRating",
              <RatingSlider
                label="Energy Rating"
                value={form.output.energyRating}
                onChange={(v) =>
                  patch("output", { ...form.output, energyRating: v })
                }
                accentColor={COLORS.warning}
              />,
            )}
            {renderOutputField(
              "output.tasksCompleted",
              <RatingSlider
                label="Tasks Completed"
                value={form.output.tasksCompleted}
                max={20}
                onChange={(v) =>
                  patch("output", { ...form.output, tasksCompleted: v })
                }
                accentColor={COLORS.success}
              />,
            )}
          </GradientCard>
        );
      }
      case "tags":
        return (
          <GradientCard style={{ marginBottom: 0 }}>
            <CustomTags
              selected={form.tags}
              onChange={(tags) => patch("tags", tags)}
            />
          </GradientCard>
        );
      default:
        return null;
    }
  };

  const renderUserContent = (type: EventTypeDef): React.ReactElement => {
    const entries = (form.eventEntries ?? []).filter(
      (e) => e.typeId === type.id,
    );
    return (
      <GradientCard style={{ marginBottom: 0 }}>
        <EventTypeRenderer
          type={type}
          entries={entries}
          date={form.id}
          isPastDay={form.id !== todayId()}
          onChange={(next: EventEntry[]) => {
            const others = (form.eventEntries ?? []).filter(
              (e) => e.typeId !== type.id,
            );
            patch("eventEntries", [...others, ...next]);
          }}
        />
      </GradientCard>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────

  const sectionLabelFor = (section: SectionDescriptor): string => {
    if (section.kind === "system") return section.label;
    const emoji = section.type.emoji ? `${section.type.emoji} ` : "";
    return `${emoji}${section.type.name}`;
  };

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + SPACING.lg,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  TYPOGRAPHY.hero,
                  { color: COLORS.text, marginBottom: SPACING.xs },
                ]}
              >
                Daily Log
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setEditMode((prev) => !prev);
              }}
              activeOpacity={0.7}
              style={styles.editButton}
              hitSlop={8}
            >
              <Ionicons
                name={editMode ? "checkmark" : "create-outline"}
                size={22}
                color={editMode ? COLORS.success : COLORS.accent}
              />
            </TouchableOpacity>
          </View>

          {/* 7-day week strip — taps switch which day's log is being edited. */}
          <View style={{ marginTop: SPACING.md }}>
            <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          </View>

          {/* Past-day banner — only when not on today. Includes a fast
              "back to today" affordance because the week-strip tap target
              for today is small. */}
          {isPastDay ? (
            <View style={styles.pastDayBanner}>
              <Ionicons name="time-outline" size={16} color={COLORS.warning} />
              <Text style={styles.pastDayText}>
                Editing a past day · changes here will refresh your insights
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(todayId())}
                hitSlop={6}
              >
                <Text style={styles.backToToday}>Today →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: SPACING.lg }} />
          )}

          {sections.map((section, index) => {
            const id = section.kind === "system" ? section.id : section.type.id;
            const label = sectionLabelFor(section);
            const isUser = section.kind === "user";
            const canMoveUp = index > 0;
            const canMoveDown = index < sections.length - 1;

            return (
              <View key={id} style={{ marginBottom: SPACING.lg }}>
                <View style={styles.sectionHeaderRow}>
                  <SectionLabel label={label} />
                  {editMode ? (
                    <View style={styles.editControls}>
                      <TouchableOpacity
                        onPress={() =>
                          canMoveUp ? moveSection(index, -1) : undefined
                        }
                        disabled={!canMoveUp}
                        hitSlop={6}
                        style={[
                          styles.editIconBtn,
                          !canMoveUp && styles.editIconBtnDisabled,
                        ]}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={14}
                          color={COLORS.text}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          canMoveDown ? moveSection(index, 1) : undefined
                        }
                        disabled={!canMoveDown}
                        hitSlop={6}
                        style={[
                          styles.editIconBtn,
                          !canMoveDown && styles.editIconBtnDisabled,
                        ]}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={14}
                          color={COLORS.text}
                        />
                      </TouchableOpacity>
                      {isUser ? (
                        <TouchableOpacity
                          onPress={() => setEditingTypeId(id)}
                          hitSlop={6}
                          style={styles.editIconBtn}
                        >
                          <Ionicons
                            name="pencil"
                            size={13}
                            color={COLORS.text}
                          />
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => hideSection(id)}
                        hitSlop={6}
                        style={[styles.editIconBtn, styles.editIconBtnDanger]}
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
                {section.kind === "system"
                  ? renderSystemContent(section.id)
                  : renderUserContent(section.type)}
              </View>
            );
          })}

          {editMode ? (
            <TouchableOpacity
              onPress={() => setEditingTypeId("__new__")}
              activeOpacity={0.7}
              style={styles.newTypeTile}
            >
              <Ionicons name="add-circle" size={22} color={COLORS.accent} />
              <Text style={styles.newTypeText}>New metric</Text>
            </TouchableOpacity>
          ) : null}

          {settings.hiddenLogSections.length > 0 && editMode ? (
            <HiddenSectionsRow
              hidden={settings.hiddenLogSections}
              eventTypes={eventTypes}
              onUnhide={(id) =>
                void updateSettings({
                  hiddenLogSections: settings.hiddenLogSections.filter(
                    (h) => h !== id,
                  ),
                })
              }
            />
          ) : null}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={{ marginTop: SPACING.lg }}
          >
            <LinearGradient
              colors={
                saved
                  ? (COLORS.gradients.success as [string, string])
                  : (COLORS.gradients.accent as [string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {saved
                  ? "✓ Saved"
                  : isPastDay
                    ? "Save backfilled log"
                    : "Save Today's Log"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SchemaBuilder
        visible={editingTypeId !== null}
        initial={schemaBuilderInitial}
        fieldsWithData={fieldsWithData}
        hasEntries={typeHasEntries}
        onCancel={() => setEditingTypeId(null)}
        onSave={handleSchemaSave}
        onDelete={
          editingTypeId && editingTypeId !== "__new__"
            ? handleSchemaDelete
            : undefined
        }
      />
    </LinearGradient>
  );
}

// ── Hidden-sections row ──────────────────────────────────────────────────

function HiddenSectionsRow({
  hidden,
  eventTypes,
  onUnhide,
}: {
  hidden: (LogSectionId | string)[];
  eventTypes: EventTypeDef[];
  onUnhide: (id: LogSectionId | string) => void;
}) {
  const labels = useMemo(() => {
    const sysById = new Map(LOG_SECTIONS.map((s) => [s.id, s.label]));
    const userById = new Map(eventTypes.map((t) => [t.id, t.name]));
    return hidden.map((id) => ({
      id,
      label: sysById.get(id as LogSectionId) ?? userById.get(id) ?? id,
    }));
  }, [hidden, eventTypes]);

  if (labels.length === 0) return null;

  return (
    <View style={styles.hiddenWrap}>
      <Text style={styles.hiddenLabel}>Hidden</Text>
      <View style={styles.hiddenChips}>
        {labels.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onUnhide(item.id)}
            activeOpacity={0.7}
            style={styles.hiddenChip}
          >
            <Ionicons name="add" size={12} color={COLORS.textSecondary} />
            <Text style={styles.hiddenChipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  editControls: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "center",
  },
  editIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  editIconBtnDisabled: {
    opacity: 0.35,
  },
  editIconBtnDanger: {
    borderColor: "rgba(248,113,113,0.4)",
  },
  fieldHideToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  fieldHideText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  newTypeTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginTop: SPACING.md,
  },
  newTypeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  hiddenWrap: {
    marginTop: SPACING.lg,
  },
  hiddenLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
  } as object,
  hiddenChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  hiddenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  hiddenChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  } as object,
  saveButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
  },
  saveButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  pastDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(251,191,36,0.08)",
  },
  pastDayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontSize: 12,
    flex: 1,
  } as object,
  backToToday: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 12,
  } as object,
});

const logStyles = StyleSheet.create({
  rockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  rockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rockBadgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  rockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  } as object,
  editLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: SPACING.xs,
  },
  editLinkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "600",
  } as object,
});
