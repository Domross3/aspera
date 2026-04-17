export interface FirebaseBrowsingDay {
  date: string;
  sites: Record<
    string,
    {
      time: number;
      category: "productive" | "neutral" | "distracting";
      visits: number;
      hostname?: string;
    }
  >;
  totals: { productive: number; neutral: number; distracting: number };
  focusScore: number;
  bigRock?: { task: string; isDeepWork: boolean };
  updatedAt: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function fetchBrowsingFromFirebase(): Promise<
  FirebaseBrowsingDay[]
> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return [];

  try {
    const res = await fetch(`${apiUrl}/api/browsing`);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      latest: unknown;
      all: Record<string, unknown>;
    };

    const keys = [todayKey(), yesterdayKey()];
    const results: FirebaseBrowsingDay[] = [];

    for (const key of keys) {
      const day = data.all?.[key];
      if (day && (day as FirebaseBrowsingDay).sites) {
        results.push(day as FirebaseBrowsingDay);
      }
    }

    return results;
  } catch {
    // backend unreachable — caller will fall back to mock
    return [];
  }
}
