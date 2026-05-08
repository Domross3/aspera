import { NextResponse } from 'next/server';
import { runSearch } from "@/lib/api/search";
import { DailyLog } from "@/types";

export async function POST(req: Request) {
  // Verify the shared mobile secret
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.MOBILE_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { query: string; logs: DailyLog[] };
    const result = await runSearch(body.query, body.logs);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.value);
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}