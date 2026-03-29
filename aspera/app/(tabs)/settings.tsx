import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../../src/hooks/useSettings';
import { clearAllLogs, clearInsights } from '../../src/storage/storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';
import GradientCard from '../../src/components/common/GradientCard';
import SectionLabel from '../../src/components/common/SectionLabel';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, loading, update } = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (!loading) setApiKeyInput(settings.claudeApiKey);
  }, [loading, settings.claudeApiKey]);

  const handleSaveKey = async () => {
    await update({ claudeApiKey: apiKeyInput.trim() });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all logs and cached insights. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllLogs();
            await clearInsights();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradients.background as [string, string]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[TYPOGRAPHY.hero, { color: COLORS.text, marginBottom: SPACING.xs }]}>Settings</Text>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginBottom: SPACING.xl }]}>
          Configure your AI-powered optimizer
        </Text>

        {/* API Key */}
        <SectionLabel label="Claude API Key" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginBottom: SPACING.sm }]}>
            Required to generate AI insights. Your key is stored locally only.
          </Text>
          <TextInput
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-ant-..."
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, TYPOGRAPHY.body as object]}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSaveKey}
          />
          <TouchableOpacity
            style={[styles.button, saved && styles.buttonSuccess]}
            onPress={handleSaveKey}
            activeOpacity={0.8}
          >
            <Text style={[TYPOGRAPHY.subtitle as object, { color: COLORS.text }]}>
              {saved ? '✓ Saved' : 'Save Key'}
            </Text>
          </TouchableOpacity>
        </GradientCard>

        {/* About */}
        <SectionLabel label="About" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <View style={styles.row}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>App</Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>Aspera</Text>
          </View>
          <View style={[styles.row, { marginTop: SPACING.sm }]}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>Version</Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.row, { marginTop: SPACING.sm }]}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>AI Model</Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>claude-sonnet-4-6</Text>
          </View>
        </GradientCard>

        {/* Danger Zone */}
        <SectionLabel label="Data" />
        <TouchableOpacity onPress={handleClearData} activeOpacity={0.8}>
          <GradientCard colors={['#2A1515', '#1A0E0E']}>
            <Text style={[TYPOGRAPHY.subtitle as object, { color: COLORS.danger }]}>Clear All Data</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted, marginTop: SPACING.xs }]}>
              Permanently delete all logs and insights
            </Text>
          </GradientCard>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: COLORS.success,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
