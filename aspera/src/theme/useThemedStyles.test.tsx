import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { type AsperaColors, ThemeProvider, useTheme } from "./ThemeProvider";
import { useThemedStyles } from "./useThemedStyles";

const makeStyles = (c: AsperaColors) => ({
  box: { backgroundColor: c.background },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("useThemedStyles", () => {
  it("is stable across re-renders while the theme is constant", () => {
    const { result, rerender } = renderHook(() => useThemedStyles(makeStyles), {
      wrapper,
    });
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });

  it("rebuilds styles with the new palette after a toggle", async () => {
    const { result } = renderHook(
      () => ({ styles: useThemedStyles(makeStyles), theme: useTheme() }),
      { wrapper },
    );
    const darkStyles = result.current.styles;
    const darkBg = result.current.styles.box.backgroundColor;
    await act(async () => {
      await result.current.theme.toggleTheme();
    });
    expect(result.current.styles).not.toBe(darkStyles);
    expect(result.current.styles.box.backgroundColor).not.toBe(darkBg);
    expect(result.current.styles.box.backgroundColor).toBe("#ece9e1");
  });
});
