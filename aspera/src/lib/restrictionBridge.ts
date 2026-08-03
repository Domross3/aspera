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
    // Delay mode now has real teeth: the ShieldConfiguration + ShieldAction
    // extensions render Aspera's pause over the blocked app and lift the shield
    // once the user has sat through it. Before those targets existed this
    // branch deliberately cleared the shield, which is why the feature did
    // nothing outside the app.
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
