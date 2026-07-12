import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { generateShortlist } from "@/services/shortlists";

const BodySchema = z.object({
  language: z.enum(["fr", "en"]).default("fr"),
});

// M5 — Génère le shortlist PDF brandé (candidats validés uniquement).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const result = await generateShortlist({
      supabase,
      agency: session.agency,
      mandateId: id,
      language: parsed.data.language,
      actorEmail: session.email,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "La génération a échoué.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
