// SchemaBuilder — bottom-sheet editor for creating or editing an
// EventTypeDef. Lives under the Log tab; opened from edit mode (tap an
// existing user-defined section to edit; tap "+ New event type" to create).
//
// What it covers:
//   - Type metadata: name, emoji, cardinality (single | recurrent)
//   - Fields list: add / remove / set kind / set required
//   - Per-kind config inputs: scale (min/max), chips (options + multi),
//     counter (step/min/max/unit), duration (step), text (multiline)
//   - Guardrails: when a field already has stored values, its kind is
//     locked. Cardinality is locked once the type has any entries.
//
// What it intentionally skips (v1):
//   - Drag reorder (use up/down arrows in a follow-up if needed).
//   - Pre-built templates.
//   - Conditional / nested fields.

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import type { EventTypeDef, FieldDef, FieldKind } from "../../types";

interface Props {
  visible: boolean;
  // null = creating; existing def = editing.
  initial: EventTypeDef | null;
  // Field ids that already have stored values across historical entries.
  // Their kind is locked — kind changes would invalidate that data.
  fieldsWithData: Set<string>;
  // True when ANY EventEntry of this type exists. Locks the cardinality
  // toggle because changing it reshapes how entries are interpreted.
  hasEntries: boolean;
  onCancel: () => void;
  onSave: (next: EventTypeDef) => void;
  // Only meaningful in edit mode.
  onDelete?: () => void;
}

const FIELD_KIND_OPTIONS: { kind: FieldKind; label: string }[] = [
  { kind: "toggle", label: "Toggle" },
  { kind: "scale", label: "Scale" },
  { kind: "chips", label: "Chips" },
  { kind: "counter", label: "Counter" },
  { kind: "text", label: "Text" },
  { kind: "duration", label: "Duration" },
];

function genFieldId(): string {
  return `f-${Math.random().toString(36).slice(2, 10)}`;
}

function genTypeId(): string {
  return `t-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDraft(): EventTypeDef {
  return {
    id: genTypeId(),
    name: "",
    cardinality: "single",
    fields: [],
    createdAt: Date.now(),
  };
}

export default function SchemaBuilder({
  visible,
  initial,
  fieldsWithData,
  hasEntries,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<EventTypeDef>(() => initial ?? emptyDraft());

  // Reset draft each time the sheet opens for a different target.
  useEffect(() => {
    if (visible) {
      setDraft(initial ?? emptyDraft());
    }
  }, [visible, initial]);

  const isEditing = !!initial;
  const canSave = draft.name.trim().length > 0;

  const updateField = (id: string, patch: Partial<FieldDef>) => {
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const updateFieldConfig = (
    id: string,
    configPatch: Partial<NonNullable<FieldDef["config"]>>,
  ) => {
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) =>
        f.id === id
          ? { ...f, config: { ...(f.config ?? {}), ...configPatch } }
          : f,
      ),
    }));
  };

  const addField = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft((d) => ({
      ...d,
      fields: [
        ...d.fields,
        {
          id: genFieldId(),
          name: "",
          kind: "toggle",
          required: false,
        },
      ],
    }));
  };

  const removeField = (id: string) => {
    if (fieldsWithData.has(id)) {
      Alert.alert(
        "This field has stored entries",
        "Removing it will clear those values across historical logs. Use “Delete and recreate” if you want a fresh field — or keep this one.",
      );
      return;
    }
    setDraft((d) => ({
      ...d,
      fields: d.fields.filter((f) => f.id !== id),
    }));
  };

  const requestKindChange = (id: string, kind: FieldKind) => {
    if (fieldsWithData.has(id)) {
      Alert.alert(
        "Field has stored values",
        "Changing its kind would invalidate that data. Delete this field and add a new one instead — that confirm screen will spell out how many entries will be cleared.",
      );
      return;
    }
    updateField(id, { kind, config: undefined });
  };

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...draft,
      name: draft.name.trim(),
      emoji: draft.emoji?.trim() || undefined,
      fields: draft.fields.map((f) => ({ ...f, name: f.name.trim() || f.kind })),
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      "Delete this metric?",
      hasEntries
        ? "All historical entries for this metric will also be deleted. This cannot be undone."
        : "This cannot be undone.",
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
                {isEditing ? "Edit metric" : "New metric"}
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
              {/* Name + emoji */}
              <View style={styles.nameRow}>
                <TextInput
                  placeholder="🙂"
                  placeholderTextColor={COLORS.textMuted}
                  value={draft.emoji ?? ""}
                  onChangeText={(v) =>
                    setDraft((d) => ({ ...d, emoji: v.slice(0, 2) }))
                  }
                  style={styles.emojiInput}
                  maxLength={2}
                />
                <TextInput
                  placeholder="Metric name (e.g. Lion's mane, Workout)"
                  placeholderTextColor={COLORS.textMuted}
                  value={draft.name}
                  onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                  style={styles.nameInput}
                  maxLength={40}
                  returnKeyType="done"
                />
              </View>

              {/* Cardinality */}
              <Text style={styles.sectionLabel}>How often?</Text>
              <View style={styles.cardinalityRow}>
                <CardinalityChoice
                  label="Once a day"
                  caption="Single value per day (e.g. supplement, sleep quality)"
                  active={draft.cardinality === "single"}
                  disabled={hasEntries && draft.cardinality !== "single"}
                  onPress={() =>
                    setDraft((d) => ({ ...d, cardinality: "single" }))
                  }
                />
                <CardinalityChoice
                  label="Multiple times"
                  caption="Each occurrence is timestamped (e.g. workout, dose)"
                  active={draft.cardinality === "recurrent"}
                  disabled={hasEntries && draft.cardinality !== "recurrent"}
                  onPress={() =>
                    setDraft((d) => ({ ...d, cardinality: "recurrent" }))
                  }
                />
              </View>
              {hasEntries ? (
                <Text style={styles.hint}>
                  Locked because this metric already has entries. Delete and
                  recreate to change the shape.
                </Text>
              ) : null}

              {/* Fields */}
              <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
                Fields
              </Text>
              {draft.fields.length === 0 ? (
                <Text style={styles.hint}>
                  A single-toggle field is fine for things like “took my
                  vitamin.” Add a scale, counter, or chips for richer logs.
                </Text>
              ) : null}
              {draft.fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  locked={fieldsWithData.has(field.id)}
                  onChangeName={(name) => updateField(field.id, { name })}
                  onChangeKind={(kind) => requestKindChange(field.id, kind)}
                  onToggleRequired={(required) =>
                    updateField(field.id, { required })
                  }
                  onConfigChange={(patch) => updateFieldConfig(field.id, patch)}
                  onRemove={() => removeField(field.id)}
                />
              ))}

              <TouchableOpacity
                onPress={addField}
                activeOpacity={0.7}
                style={styles.addFieldRow}
              >
                <Ionicons name="add-circle" size={18} color={COLORS.accent} />
                <Text style={styles.addFieldText}>Add field</Text>
              </TouchableOpacity>

              {isEditing && onDelete ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  style={styles.deleteRow}
                >
                  <Text style={styles.deleteText}>Delete this metric</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────

function CardinalityChoice({
  label,
  caption,
  active,
  disabled,
  onPress,
}: {
  label: string;
  caption: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.cardinalityTile,
        active && styles.cardinalityTileActive,
        disabled && styles.cardinalityTileDisabled,
      ]}
    >
      <Text
        style={[
          styles.cardinalityLabel,
          active && { color: COLORS.text, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
      <Text style={styles.cardinalityCaption}>{caption}</Text>
    </TouchableOpacity>
  );
}

function FieldEditor({
  field,
  index,
  locked,
  onChangeName,
  onChangeKind,
  onToggleRequired,
  onConfigChange,
  onRemove,
}: {
  field: FieldDef;
  index: number;
  locked: boolean;
  onChangeName: (name: string) => void;
  onChangeKind: (kind: FieldKind) => void;
  onToggleRequired: (next: boolean) => void;
  onConfigChange: (patch: Partial<NonNullable<FieldDef["config"]>>) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.fieldCard}>
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.fieldIndex}>Field {index + 1}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Field name (e.g. Intensity, Type)"
        placeholderTextColor={COLORS.textMuted}
        value={field.name}
        onChangeText={onChangeName}
        style={styles.input}
        maxLength={40}
      />

      <Text style={styles.miniLabel}>Kind</Text>
      <View style={styles.kindRow}>
        {FIELD_KIND_OPTIONS.map((opt) => {
          const active = opt.kind === field.kind;
          return (
            <TouchableOpacity
              key={opt.kind}
              onPress={() => onChangeKind(opt.kind)}
              disabled={locked && !active}
              activeOpacity={0.7}
              style={[
                styles.kindChip,
                active && styles.kindChipActive,
                locked && !active && styles.kindChipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.kindChipText,
                  active && styles.kindChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {locked ? (
        <Text style={styles.miniHint}>
          Field has stored values — kind is locked. Remove + re-add to change.
        </Text>
      ) : null}

      {/* Per-kind config */}
      <KindConfigEditor field={field} onConfigChange={onConfigChange} />

      <View style={styles.requiredRow}>
        <Text style={styles.requiredLabel}>Required</Text>
        <Switch
          value={field.required}
          onValueChange={onToggleRequired}
          trackColor={{ false: COLORS.border, true: COLORS.accent }}
          thumbColor={COLORS.text}
        />
      </View>
    </View>
  );
}

function KindConfigEditor({
  field,
  onConfigChange,
}: {
  field: FieldDef;
  onConfigChange: (patch: Partial<NonNullable<FieldDef["config"]>>) => void;
}) {
  const cfg = field.config ?? {};

  switch (field.kind) {
    case "scale":
      return (
        <View style={styles.configRow}>
          <ConfigNumberInput
            label="Min"
            value={cfg.min ?? 1}
            onChange={(n) => onConfigChange({ min: n })}
          />
          <ConfigNumberInput
            label="Max"
            value={cfg.max ?? 10}
            onChange={(n) => onConfigChange({ max: n })}
          />
        </View>
      );
    case "counter":
      return (
        <View style={styles.configRow}>
          <ConfigNumberInput
            label="Step"
            value={cfg.step ?? 1}
            onChange={(n) => onConfigChange({ step: n })}
          />
          <ConfigNumberInput
            label="Min"
            value={cfg.min ?? 0}
            onChange={(n) => onConfigChange({ min: n })}
          />
          <ConfigTextInput
            label="Unit"
            value={cfg.unit ?? ""}
            placeholder="e.g. mg"
            onChange={(v) => onConfigChange({ unit: v || undefined })}
          />
        </View>
      );
    case "chips":
      return (
        <View>
          <Text style={styles.miniLabel}>
            Options (comma-separated)
          </Text>
          <TextInput
            placeholder="e.g. run, lift, yoga, walk"
            placeholderTextColor={COLORS.textMuted}
            value={(cfg.options ?? []).join(", ")}
            onChangeText={(v) =>
              onConfigChange({
                options: v
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0),
              })
            }
            style={styles.input}
          />
          <View style={styles.requiredRow}>
            <Text style={styles.requiredLabel}>Allow multiple</Text>
            <Switch
              value={cfg.multi ?? false}
              onValueChange={(v) => onConfigChange({ multi: v })}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
        </View>
      );
    case "duration":
      return (
        <View style={styles.configRow}>
          <ConfigNumberInput
            label="Step (min)"
            value={cfg.step ?? 15}
            onChange={(n) => onConfigChange({ step: n })}
          />
        </View>
      );
    case "text":
      return (
        <View style={styles.requiredRow}>
          <Text style={styles.requiredLabel}>Multiline</Text>
          <Switch
            value={cfg.multiline ?? false}
            onValueChange={(v) => onConfigChange({ multiline: v })}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>
      );
    case "toggle":
    default:
      return null;
  }
}

function ConfigNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);
  return (
    <View style={styles.configCell}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          const parsed = parseFloat(v);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        keyboardType="numeric"
        style={styles.input}
      />
    </View>
  );
}

function ConfigTextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.configCell}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
      />
    </View>
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
  doneDisabled: {
    color: COLORS.textMuted,
  },
  body: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 40,
  },
  nameRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  emojiInput: {
    ...TYPOGRAPHY.subtitle,
    width: 56,
    textAlign: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    color: COLORS.text,
  } as object,
  nameInput: {
    ...TYPOGRAPHY.body,
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
  } as object,
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
  } as object,
  cardinalityRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  cardinalityTile: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  cardinalityTileActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  cardinalityTileDisabled: {
    opacity: 0.4,
  },
  cardinalityLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
  cardinalityCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginTop: SPACING.xs,
  } as object,
  fieldCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldIndex: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  } as object,
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  } as object,
  miniLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  } as object,
  miniHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontSize: 11,
    fontStyle: "italic",
  } as object,
  kindRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  kindChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  kindChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  kindChipDisabled: {
    opacity: 0.4,
  },
  kindChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  } as object,
  kindChipTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  configRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  configCell: {
    flex: 1,
  },
  requiredRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.xs,
  },
  requiredLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
  addFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginTop: SPACING.sm,
  },
  addFieldText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
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
