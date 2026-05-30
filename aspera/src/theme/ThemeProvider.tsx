import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { COLORS } from "../constants/theme";

export type AsperaTheme = "dark" | "light";
export type AsperaColors = typeof COLORS;

const STORAGE_KEY = "aspera:theme";

const LIGHT_COLORS: AsperaColors = {
  ...COLORS,
  background: "#ece9e1",
  surface: "#f4f1e9",
  surfaceElevated: "#fbf8f1",
  accent: "#a39d8f",
  accentAlt: "#57534a",
  accentGlow: "rgba(163,157,143,0.22)",
  text: "#232019",
  textSecondary: "#57534a",
  textMuted: "#8d887d",
  success: "#57534a",
  warning: "#927752",
  danger: "#927752",
  border: "rgba(35,32,25,0.2)",
  borderAccent: "rgba(35,32,25,0.2)",
  gradients: {
    card: ["#fbf8f1", "#f4f1e9"],
    accent: ["#dcd7cb", "#f1eee6"],
    energy: ["#57534a", "#8d887d"],
    focus: ["#9d988e", "#57534a"],
    success: ["#57534a", "#8d887d"],
    background: ["#ece9e1", "#f4f1e9"],
  },
  intensity: [
    "#fbf8f1",
    "#f4f1e9",
    "#ece9e1",
    "#dcd7cb",
    "#c9c3b7",
    "#b6b1a5",
    "#9d988e",
    "#8d887d",
    "#57534a",
    "#232019",
  ],
  faint: "#b6b1a5",
  line: "rgba(35,32,25,0.11)",
  ring: "#9d988e",
  glow: "#a39d8f",
  orbA: "#dcd7cb",
  orbB: "#f1eee6",
  critical: "#927752",
  grain: 0.05,
};

interface ThemeContextValue {
  theme: AsperaTheme;
  colors: AsperaColors;
  setTheme: (theme: AsperaTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<AsperaTheme>("dark");

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
      }
    });
  }, []);

  const setTheme = useCallback(async (next: AsperaTheme) => {
    setThemeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      colors: theme === "dark" ? COLORS : LIGHT_COLORS,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return value;
}
