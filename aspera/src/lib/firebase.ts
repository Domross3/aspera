const FIREBASE_URL = "https://aspera-bridge-default-rtdb.firebaseio.com";

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
  const keys = [todayKey(), yesterdayKey()];
  const results: FirebaseBrowsingDay[] = [];

  for (const key of keys) {
    try {
      const res = await fetch(`${FIREBASE_URL}/browsing/${key}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.sites) {
          results.push(data);
        }
      }
    } catch {
      // Firebase unreachable — caller will fall back to mock
    }
  }

  return results;
}
