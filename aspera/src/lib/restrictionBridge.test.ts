import type { Restriction } from "../types";
import type { RestrictionNativeBridge } from "./restrictionBridge";
import {
  deleteRestrictionWithNative,
  pickRestrictionSelection,
  saveRestrictionWithNative,
} from "./restrictionBridge";
import { createDefaultRestriction } from "./restrictions";

function createNativeMock(): RestrictionNativeBridge {
  return {
    presentPicker: jest.fn(async () => ({
      selectedAppCount: 0,
      selectedCategoryCount: 0,
      cancelled: true,
    })),
    startMonitoring: jest.fn(async () => {}),
    stopMonitoring: jest.fn(async () => {}),
    clearShield: jest.fn(async () => {}),
    clearRestrictionState: jest.fn(async () => {}),
  };
}

describe("restriction bridge", () => {
  it("updates selected counts from the native picker", async () => {
    const native = createNativeMock();
    native.presentPicker = jest.fn(async () => ({
      selectedAppCount: 3,
      selectedCategoryCount: 1,
      cancelled: false,
    }));
    const draft = createDefaultRestriction("time_window", 1000);

    const next = await pickRestrictionSelection(draft, native, 2000);

    expect(native.presentPicker).toHaveBeenCalledWith(draft.id);
    expect(next.selectedAppCount).toBe(3);
    expect(next.selectedCategoryCount).toBe(1);
    expect(next.updatedAt).toBe(2000);
  });

  it("leaves counts alone when picker is cancelled", async () => {
    const native = createNativeMock();
    const draft = {
      ...createDefaultRestriction("time_window", 1000),
      selectedAppCount: 2,
      selectedCategoryCount: 1,
    };

    await expect(pickRestrictionSelection(draft, native, 2000)).resolves.toBe(
      draft,
    );
  });

  it("starts monitoring before saving an active restriction", async () => {
    const native = createNativeMock();
    const calls: string[] = [];
    native.startMonitoring = jest.fn(async () => {
      calls.push("native:start");
    });
    const persistence = {
      upsertRestriction: jest.fn(async () => {
        calls.push("supabase:upsert");
      }),
      deleteRestriction: jest.fn(async () => {}),
    };
    const restriction: Restriction = {
      ...createDefaultRestriction("daily_limit", 1000),
      active: true,
      selectedAppCount: 1,
      spec: { kind: "daily_limit", dailyLimitMin: 25 },
    };

    await saveRestrictionWithNative("user-a", restriction, persistence, native);

    expect(calls).toEqual(["native:start", "supabase:upsert"]);
    expect(native.startMonitoring).toHaveBeenCalledWith(
      expect.objectContaining({
        id: restriction.id,
        active: true,
        mode: "daily_limit",
        dailyLimitMin: 25,
      }),
    );
  });

  it("stops monitoring and clears shields before saving an inactive restriction", async () => {
    const native = createNativeMock();
    const persistence = {
      upsertRestriction: jest.fn(async () => {}),
      deleteRestriction: jest.fn(async () => {}),
    };
    const restriction: Restriction = {
      ...createDefaultRestriction("time_window", 1000),
      active: false,
    };

    await saveRestrictionWithNative("user-a", restriction, persistence, native);

    expect(native.stopMonitoring).toHaveBeenCalledWith(restriction.id);
    expect(native.clearShield).toHaveBeenCalledWith(restriction.id);
    expect(native.startMonitoring).not.toHaveBeenCalled();
    expect(persistence.upsertRestriction).toHaveBeenCalledWith(
      "user-a",
      expect.objectContaining({ id: restriction.id, active: false }),
    );
  });

  it("cleans up native state before deleting from Supabase", async () => {
    const native = createNativeMock();
    const calls: string[] = [];
    native.stopMonitoring = jest.fn(async () => {
      calls.push("native:stop");
    });
    native.clearShield = jest.fn(async () => {
      calls.push("native:clear");
    });
    native.clearRestrictionState = jest.fn(async () => {
      calls.push("native:state");
    });
    const persistence = {
      upsertRestriction: jest.fn(async () => {}),
      deleteRestriction: jest.fn(async () => {
        calls.push("supabase:delete");
      }),
    };

    await deleteRestrictionWithNative(
      "user-a",
      "restriction-a",
      persistence,
      native,
    );

    expect(calls).toEqual([
      "native:stop",
      "native:clear",
      "native:state",
      "supabase:delete",
    ]);
  });
});
