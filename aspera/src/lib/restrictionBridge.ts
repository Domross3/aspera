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
  // True only when the native ManagedSettingsUI shield extension is present, so
  // a delay can render the Aspera pause + grant a timed unlock. When false, a
  // delay must NOT be hard-shielded (Apple's default shield is a permanent
  // lockout with no "wait then continue" path).
  supportsDelayShield: boolean;
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
    if (restriction.spec.kind === "delay") {
      // A gratification delay must add FRICTION and then allow access — never a
      // permanent lockout. Apple's default ManagedSettings shield is a hard
      // block with no "wait then continue" path, so we only shield a delay when
      // the native ManagedSettingsUI shield extension is present: it renders the
      // Aspera pause and grants a timed unlock once the delay elapses. Until
      // that extension ships, persisting the bare shield would wall the app off
      // forever — so we explicitly DO NOT shield, and we aggressively clear any
      // stale shield/monitor state (flush via an inactive monitor, then clear).
      if (native.supportsDelayShield) {
        await native.startMonitoring(toNativeRestrictionConfig(restriction));
        await native.applyShield(restriction.id);
      } else {
        const inactiveNativeConfig = {
          ...toNativeRestrictionConfig(restriction),
          active: false,
        };
        await native.startMonitoring(inactiveNativeConfig).catch(async () => {
          await native.stopMonitoring(restriction.id);
        });
        await native.clearShield(restriction.id);
      }
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
