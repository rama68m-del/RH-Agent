import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { interpretSearchQuery } from "@/services/ai/search";
import { searchCandidates } from "@/services/candidates";

// M3 — Recherche CVthèque.
// ?q=... : langage naturel (interprété par Claude)
// ?skills=a,b&languages=x&location=y : filtres directs
export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();

  try {
    let filters;
    if (q) {
      filters = await interpretSearchQuery(q);
    } else {
      filters = {
        skills:
          searchParams.get("skills")?.split(",").map((s) => s.trim())
            .filter(Boolean) ?? [],
        languages:
          searchParams.get("languages")?.split(",").map((s) => s.trim())
            .filter(Boolean) ?? [],
        location: searchParams.get("location") || null,
        keywords: [],
      };
    }

    const supabase = await createClient();
    const candidates = await searchCandidates(supabase, filters);
    return NextResponse.json({ ok: true, filters, candidates });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "La recherche a échoué.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
