import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { runMatchingForMandate } from "@/services/matches";

// M4 — Lance le matching IA pour un mandat.
// Les propositions restent non validées tant que le recruteur n'a pas cliqué.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const supabase = await createClient();
    const matches = await runMatchingForMandate(supabase, id, session.email);
    return NextResponse.json({ ok: true, matches });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Le matching a échoué.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
