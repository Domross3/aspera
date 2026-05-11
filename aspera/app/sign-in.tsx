// Sign-in screen — gateway to the app.
//
// Apple Sign In is the only auth path for now. The Apple flow returns an
// identity token signed by Apple; we hand it to Supabase, which validates
// the token, creates or links a user record, and returns a session. The
// session is then persisted by the supabase client (AsyncStorage), and the
// _layout.tsx auth guard lets the user into the tabs.
//
// UX: a single Apple-branded button at the center of the screen + minimal
// copy. Pure native, no email, no passwords. Apple's HIG requires the
// official `AppleAuthentication.AppleAuthenticationButton` component (we
// can't substitute a custom button styled to look like Apple's).

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../src/lib/supabase";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAppleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple did not return an identity token.");
      }

      const { error: supaErr } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (supaErr) throw supaErr;
      // The useAuth listener in _layout.tsx picks this up and routes us in.
    } catch (err: unknown) {
      // User cancelled the native sheet — silent dismissal, not an error.
      const code = (err as { code?: string }).code;
      if (code === "ERR_REQUEST_CANCELED") {
        setBusy(false);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Try again.";
      setError(message);
      Alert.alert("Sign-in error", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.xl * 2,
            paddingBottom: insets.bottom + SPACING.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[TYPOGRAPHY.hero, { color: COLORS.text }]}>Aspera</Text>
          <Text
            style={[
              TYPOGRAPHY.body,
              {
                color: COLORS.textSecondary,
                marginTop: SPACING.sm,
                textAlign: "center",
              },
            ]}
          >
            Your personal operating system.{"\n"}Sign in to start tracking.
          </Text>
        </View>

        <View style={styles.actions}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              }
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : (
            <Text style={[TYPOGRAPHY.body, { color: COLORS.danger }]}>
              Apple Sign In is iOS-only for now.
            </Text>
          )}

          {busy && (
            <View style={{ marginTop: SPACING.md }}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          )}

          {error && (
            <Text
              style={[
                TYPOGRAPHY.caption,
                {
                  color: COLORS.danger,
                  marginTop: SPACING.md,
                  textAlign: "center",
                },
              ]}
            >
              {error}
            </Text>
          )}

          <Text
            style={[
              TYPOGRAPHY.caption,
              {
                color: COLORS.textMuted,
                marginTop: SPACING.xl,
                textAlign: "center",
              },
            ]}
          >
            By signing in you agree to Aspera's data handling.{"\n"}
            We don't share your data with anyone.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "space-between",
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    alignItems: "center",
  },
  appleButton: {
    width: "100%",
    maxWidth: 320,
    height: 52,
  },
});
