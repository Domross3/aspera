// Type surface for the screen-time local native module (Family Controls /
// DeviceActivity / ManagedSettings bridge). Kept dependency-free so the JS
// layer can import these types even on builds where the native module is
// absent (e.g. an OTA landing on an older 1.0.0 binary).

export type ScreenTimeAuthStatus =
  | "notDetermined"
  | "denied"
  | "approved"
  // The native module isn't present in this binary (older build / Android).
  | "unavailable";

// Returned by presentPicker — the app never learns app names, only counts.
export interface PickerResult {
  selectedAppCount: number;
  selectedCategoryCount: number;
  // True if the user cancelled the picker without changing the selection.
  cancelled: boolean;
}

// Per-category usage for a single day, surfaced by the report extension.
export interface ScreenTimeDayTotals {
  date: string; // "YYYY-MM-DD"
  // Minutes per locked category key (social/entertainment/…/other).
  byCategory: Record<string, number>;
  totalMinutes: number;
}

export interface NativeRestrictionConfig {
  id: string;
  active: boolean;
  mode: "time_window" | "daily_limit";
  weekdays: number[]; // 0=Sun … 6=Sat
  windowStart?: string; // "HH:MM"
  windowEnd?: string; // "HH:MM"
  dailyLimitMin?: number;
  selectedAppCount: number;
  selectedCategoryCount: number;
  updatedAt: number;
}

export interface ScreenTimeNativeModule {
  getAuthorizationStatus(): ScreenTimeAuthStatus;
  requestAuthorization(): Promise<ScreenTimeAuthStatus>;
  // Presents the system FamilyActivityPicker for a restriction id, persists
  // the selection to the App Group, and resolves with the counts.
  presentPicker(restrictionId: string): Promise<PickerResult>;
  applyShield(restrictionId: string): Promise<void>;
  clearShield(restrictionId: string): Promise<void>;
  startMonitoring(config: NativeRestrictionConfig): Promise<void>;
  stopMonitoring(restrictionId: string): Promise<void>;
  clearRestrictionState(restrictionId: string): Promise<void>;
  // Clears the shield + starts a guarded transient re-arm schedule.
  grantCheat(restrictionId: string, minutes: number): Promise<void>;
  readDailyTotals(): Promise<ScreenTimeDayTotals[]>;
}
