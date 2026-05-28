jest.mock("../../../modules/screen-time/src", () => ({
  readDailyTotals: jest.fn(),
  refreshDailyTotals: jest.fn(),
}));

import {
  readDailyTotals,
  refreshDailyTotals,
} from "../../../modules/screen-time/src";
import { readScreenTimeTotals, refreshScreenTimeTotals } from "./bridge";

const mockedRead = readDailyTotals as jest.MockedFunction<typeof readDailyTotals>;
const mockedRefresh = refreshDailyTotals as jest.MockedFunction<
  typeof refreshDailyTotals
>;

describe("screen time native bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes values read from the native module", async () => {
    mockedRead.mockResolvedValue([
      {
        date: "2026-05-20",
        byCategory: { social: 30, unknown: 5 },
        totalMinutes: 35,
      },
    ]);

    await expect(readScreenTimeTotals()).resolves.toEqual([
      {
        date: "2026-05-20",
        byCategory: {
          social: 30,
          entertainment: 0,
          productivity: 0,
          communication: 0,
          other: 5,
        },
        totalMinutes: 35,
      },
    ]);
  });

  it("uses the visible native report path for refreshes", async () => {
    mockedRefresh.mockResolvedValue([
      {
        date: "2026-05-21",
        byCategory: { productivity: 60 },
        totalMinutes: 60,
      },
    ]);

    await expect(refreshScreenTimeTotals()).resolves.toHaveLength(1);
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });
});
