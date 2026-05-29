import type { Restriction } from "../types";
import type {
  NativeRestrictionConfig,
  PickerResult,
} from "../../modules/screen-time/src/types";
import {
  normalizeRestrictionForSave,
  toNativeRestrictionConfig,
} from "./restrictions";

export interface RestrictionNativeBridge {
  presentPicker: (restrictionId: string) => Promise<PickerResult>;
  startMonitoring: (config: NativeRestrictionConfig) => Promise<void>;
  stopMonitoring: (restrictionId: string) => Promise<void>;
  applyShield: (restrictionId: string) => Promise<void>;
  clearShield: (restrictionId: string) => Promise<void>;
  clearRestrictionState: (restrictionId: string) => Promise<void>;
}

export interface RestrictionPersistenceBridge {
  upsertRestriction: (
    userId: string,
    restriction: Restriction,
  ) => Promise<void>;
  deleteRestriction: (userId: string, restrictionId: string) => Promise<void>;
}

export async function pickRestrictionSelection(
  restriction: Restriction,
  native: RestrictionNativeBridge,
  now = Date.now(),
): Promise<Restriction> {
  const result = await native.presentPicker(restriction.id);
  if (result.cancelled) return restriction;

  return {
    ...restriction,
    selectedAppCount: Math.max(0, Math.round(result.selectedAppCount)),
    selectedCategoryCount: Math.max(
      0,
      Math.round(result.selectedCategoryCount),
    ),
    updatedAt: now,
  };
}

export async function syncRestrictionNative(
  restriction: Restriction,
  native: RestrictionNativeBridge,
): Promise<void> {
  if (restriction.active) {
    // Delay mode has no schedule/monitor — it's a persistent shield that the
    // breath-pause lifts briefly via grantCheat. Shield directly rather than
    // routing through the DeviceActivity monitor used by the other kinds.
    if (restriction.spec.kind === "delay") {
      await native.applyShield(restriction.id);
      return;
    }
    await native.startMonitoring(toNativeRestrictionConfig(restriction));
    return;
  }

  await native.stopMonitoring(restriction.id);
  await native.clearShield(restriction.id);
}

export async function cleanupRestrictionNative(
  restrictionId: string,
  native: RestrictionNativeBridge,
): Promise<void> {
  await native.stopMonitoring(restrictionId);
  await native.clearShield(restrictionId);
  await native.clearRestrictionState(restrictionId);
}

export async function saveRestrictionWithNative(
  userId: string,
  restriction: Restriction,
  persistence: RestrictionPersistenceBridge,
  native: RestrictionNativeBridge,
): Promise<Restriction> {
  const normalized = normalizeRestrictionForSave(restriction);
  await syncRestrictionNative(normalized, native);

  try {
    await persistence.upsertRestriction(userId, normalized);
  } catch (error) {
    if (normalized.active) {
      await cleanupRestrictionNative(normalized.id, native).catch(() => {});
    }
    throw error;
  }

  return normalized;
}

export async function deleteRestrictionWithNative(
  userId: string,
  restrictionId: string,
  persistence: RestrictionPersistenceBridge,
  native: RestrictionNativeBridge,
): Promise<void> {
  await cleanupRestrictionNative(restrictionId, native);
  await persistence.deleteRestriction(userId, restrictionId);
}
