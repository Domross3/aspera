import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

const TOKENS_FILE = "/tmp/aspera-push-tokens.json";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    let tokens: string[] = [];
    try {
      const raw = await fs.readFile(TOKENS_FILE, "utf8");
      tokens = JSON.parse(raw) as string[];
    } catch {
      // file doesn't exist yet
    }

    if (!tokens.includes(token)) {
      tokens.push(token);
      await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf8");
      console.log(
        "[/api/push/register] Registered token:",
        token.slice(0, 20) + "...",
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[/api/push/register] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
