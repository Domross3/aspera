// useThemedStyles — the bridge that lets static StyleSheet blocks re-theme.
//
// A `StyleSheet.create({...COLORS.x...})` baked at module load can't react to
// the light/dark toggle. Instead, define a module-level `makeStyles(colors)`
// factory and call it through this hook: it pulls the active palette from
// `useTheme()` and memoizes the built stylesheet per palette identity, so a
// theme switch rebuilds styles and an ordinary re-render does not.
//
// Usage:
//   const makeStyles = (c: AsperaColors) => ({ card: { backgroundColor: c.surface } });
//   function MyCard() {
//     const styles = useThemedStyles(makeStyles);
//     ...
//   }
// Keep `makeStyles` at module scope (stable reference) so the memo key is the
// palette alone.

import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { type AsperaColors, useTheme } from "./ThemeProvider";

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  make: (colors: AsperaColors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(make(colors)), [colors, make]);
}
