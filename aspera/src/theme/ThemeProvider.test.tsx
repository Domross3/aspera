import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("ThemeProvider", () => {
  it("defaults to dark with the dark palette", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
    expect(result.current.colors.background).toBe("#0a0a09");
  });

  it("restores a persisted light theme on mount", async () => {
    await AsyncStorage.setItem("aspera:theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe("light"));
    expect(result.current.colors.background).toBe("#ece9e1");
  });

  it("toggles dark↔light and persists the choice", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      await result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
    expect(await AsyncStorage.getItem("aspera:theme")).toBe("light");
    await act(async () => {
      await result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("dark");
    expect(await AsyncStorage.getItem("aspera:theme")).toBe("dark");
  });

  it("throws when useTheme is called outside the provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });
});
