// Native time picker wrapped in a bottom sheet on iOS so it gets a clear
// Cancel/Done affordance — the iOS DateTimePicker on its own commits on
// every wheel tick, which makes "did I accidentally change this?" anxious
// for settings. On Android the system picker is already a modal dialog
// with native Confirm/Cancel, so we just render it directly when visible.

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  visible: boolean;
  initial: string; // "HH:MM"
  title?: string;
  onCancel: () => void;
  onConfirm: (hhmm: string) => void;
}

function parseHHMM(s: string): Date {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TimePickerModal({
  visible,
  initial,
  title = "Pick a time",
  onCancel,
  onConfirm,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [date, setDate] = useState(() => parseHHMM(initial));

  // Resync when reopened — the consumer may have advanced to a different row.
  useEffect(() => {
    if (visible) setDate(parseHHMM(initial));
  }, [visible, initial]);

  if (Platform.OS === "android") {
    if (!visible) return null;
    return (
      <DateTimePicker
        mode="time"
        value={date}
        onChange={(event: DateTimePickerEvent, d?: Date) => {
          if (event.type === "set" && d) {
            onConfirm(formatHHMM(d));
          } else {
            onCancel();
          }
        }}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
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
            <Text style={styles.titleText}>{title}</Text>
            <TouchableOpacity
              onPress={() => onConfirm(formatHHMM(date))}
              hitSlop={8}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            mode="time"
            value={date}
            display="spinner"
            onChange={(_event, d) => {
              if (d) setDate(d);
            }}
            textColor={colors.text}
            style={styles.picker}
          />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    backdropTouch: {
      flex: 1,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      paddingBottom: SPACING.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    cancelText: {
      ...TYPOGRAPHY.body,
      color: c.textSecondary,
    } as object,
    titleText: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
    } as object,
    doneText: {
      ...TYPOGRAPHY.body,
      color: c.accent,
      fontWeight: "700",
    } as object,
    picker: {
      height: 200,
    },
  });
