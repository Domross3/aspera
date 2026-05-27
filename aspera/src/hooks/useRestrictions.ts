import { useCallback, useEffect, useState } from "react";
import type { Restriction } from "../types";
import {
  deleteRestriction as deleteRestrictionRow,
  fetchRestrictions,
  upsertRestriction,
} from "../lib/cloudStore";
import {
  deleteRestrictionWithNative,
  pickRestrictionSelection,
  type RestrictionNativeBridge,
  saveRestrictionWithNative,
} from "../lib/restrictionBridge";
import {
  clearRestrictionState,
  clearShield,
  presentPicker,
  startMonitoring,
  stopMonitoring,
} from "../../modules/screen-time/src";
import { useAuth } from "./useAuth";

interface UseRestrictionsResult {
  restrictions: Restriction[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveRestriction: (restriction: Restriction) => Promise<Restriction>;
  deleteRestriction: (id: string) => Promise<void>;
  pickApps: (restriction: Restriction) => Promise<Restriction>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

const nativeBridge: RestrictionNativeBridge = {
  presentPicker,
  startMonitoring,
  stopMonitoring,
  clearShield,
  clearRestrictionState,
};

export function useRestrictions(): UseRestrictionsResult {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRestrictions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchRestrictions(userId);
      setRestrictions(rows);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRestriction = useCallback(
    async (restriction: Restriction) => {
      if (!userId) throw new Error("Sign in before saving app limits.");

      setSaving(true);
      setError(null);
      try {
        const normalized = await saveRestrictionWithNative(
          userId,
          restriction,
          {
            upsertRestriction,
            deleteRestriction: deleteRestrictionRow,
          },
          nativeBridge,
        );
        const rows = await fetchRestrictions(userId);
        setRestrictions(rows);
        return normalized;
      } catch (err) {
        const message = errorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const deleteRestriction = useCallback(
    async (id: string) => {
      if (!userId) throw new Error("Sign in before deleting app limits.");

      setSaving(true);
      setError(null);
      try {
        await deleteRestrictionWithNative(
          userId,
          id,
          {
            upsertRestriction,
            deleteRestriction: deleteRestrictionRow,
          },
          nativeBridge,
        );
        setRestrictions((current) => current.filter((item) => item.id !== id));
      } catch (err) {
        const message = errorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const pickApps = useCallback(async (restriction: Restriction) => {
    setError(null);
    try {
      return await pickRestrictionSelection(restriction, nativeBridge);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    restrictions,
    loading,
    saving,
    error,
    refresh,
    saveRestriction,
    deleteRestriction,
    pickApps,
  };
}
