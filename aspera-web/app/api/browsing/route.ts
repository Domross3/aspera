import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

// /tmp is writable on both local macOS/Linux and serverless runtimes (Vercel, etc.)
// process.cwd()/tmp is NOT writable on most serverless deployments.
const BROWSING_FILE = "/tmp/aspera-browsing.json";

async function ensureTmpDir() {
  // /tmp always exists; no-op kept for symmetry
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    await ensureTmpDir();
    // Merge with existing data keyed by date
    let existing: Record<string, unknown> = {};
    try {
      const raw = await fs.readFile(BROWSING_FILE, "utf8");
      existing = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // file doesn't exist yet
    }

    const date = (payload as { date?: string }).date ?? new Date().toISOString().split("T")[0];
    existing[date] = { ...payload, receivedAt: Date.now() };

    await fs.writeFile(BROWSING_FILE, JSON.stringify(existing, null, 2), "utf8");
    console.log("[/api/browsing] Saved browsing data for:", date);
    return NextResponse.json({ ok: true, date });
  } catch (err: unknown) {
    console.error("[/api/browsing] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await ensureTmpDir();
    let data: Record<string, unknown> = {};
    try {
      const raw = await fs.readFile(BROWSING_FILE, "utf8");
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // no data yet — return empty
    }

    // Return the most recent day's data
    const dates = Object.keys(data).sort().reverse();
    const latest = dates.length > 0 ? data[dates[0]] : null;
    return NextResponse.json({ latest, all: data });
  } catch (err: unknown) {
    console.error("[/api/browsing] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
