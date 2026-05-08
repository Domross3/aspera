// Mobile app POSTs its Expo push token here on app open. Stored in Supabase
// `push_tokens` (unique on expo_token). Once mobile auth lands (DOM-12), we'll
// stamp `user_id` from the session; for now `user_id` is null and tokens are
// associated with whoever physically holds the phone.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { expo_token } = await req.json();
    if (!expo_token || !expo_token.startsWith('ExponentPushToken')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Upsert the token into Supabase
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .upsert({ expo_token }, { onConflict: 'expo_token' });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}