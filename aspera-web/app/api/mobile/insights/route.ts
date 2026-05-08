// Mobile insights endpoint. The React Native app calls this with
// `Authorization: Bearer ${MOBILE_API_SECRET}` instead of a Supabase session
// (mobile auth lands in DOM-12). Otherwise identical to /api/insights.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY });

export async function POST(req: Request) {
  // Verify the shared mobile secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.MOBILE_API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, system, max_tokens } = await req.json();
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: max_tokens || 1024,
      system: system,
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json(msg);
  } catch (error: any) {
    console.error("Anthropic API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
