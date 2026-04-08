import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Handles the OAuth callback from Supabase.
 * Flow: User → Google → Supabase → /auth/callback → Home
 *
 * Supabase redirects here with a `code` query parameter.
 * We exchange it for a session, then redirect to "/".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Supabase code exchange error:", error.message);
  }

  // If no code or exchange failed, redirect to home with error
  return NextResponse.redirect(`${origin}/?auth_error=callback_failed`);
}
