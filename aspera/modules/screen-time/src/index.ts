// JS entry point for the screen-time local native module.
//
// CRITICAL: this module loads via `requireOptionalNativeModule`, which returns
// null when the native code isn't in the running binary. That happens on:
//   - Android (no Family Controls)
//   - older 1.0.0 builds that an OTA lands on before the native build ships
//   - Expo Go
// Every export degrades gracefully when the module is absent rather than
// throwing, so Tech-tab screens that import this never crash a stale binary.

import { requireOptionalNativeModule } from "expo-modules-core";
import type {
  ScreenTimeAuthStatus,
  ScreenTimeNativeModule,
  PickerResult,
  ScreenTimeDayTotals,
} from "./types";

export * from "./types";

const native = requireOptionalNativeModule<ScreenTimeNativeModule>(
  "ScreenTime",
);

/** True when the native Screen Time module is present in this binary. */
export const isScreenTimeAvailable = (): boolean => native != null;

export function getAuthorizationStatus(): ScreenTimeAuthStatus {
  if (!native) return "unavailable";
  try {
    return native.getAuthorizationStatus();
  } catch {
    return "unavailable";
  }
}

export async function requestAuthorization(): Promise<ScreenTimeAuthStatus> {
  if (!native) return "unavailable";
  return native.requestAuthorization();
}

export async function presentPicker(
  restrictionId: string,
): Promise<PickerResult> {
  if (!native) {
    return { selectedAppCount: 0, selectedCategoryCount: 0, cancelled: true };
  }
  return native.presentPicker(restrictionId);
}

export async function applyShield(restrictionId: string): Promise<void> {
  if (!native) return;
  await native.applyShield(restrictionId);
}

export async function clearShield(restrictionId: string): Promise<void> {
  if (!native) return;
  await native.clearShield(restrictionId);
}

export async function startMonitoring(restrictionId: string): Promise<void> {
  if (!native) return;
  await native.startMonitoring(restrictionId);
}

export async function stopMonitoring(restrictionId: string): Promise<void> {
  if (!native) return;
  await native.stopMonitoring(restrictionId);
}

export async function grantCheat(
  restrictionId: string,
  minutes: number,
): Promise<void> {
  if (!native) return;
  await native.grantCheat(restrictionId, minutes);
}

export async function readDailyTotals(): Promise<ScreenTimeDayTotals[]> {
  if (!native) return [];
  return native.readDailyTotals();
}
