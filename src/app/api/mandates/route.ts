import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

const CreateMandateSchema = z.object({
  title: z.string().min(2, "Intitulé du poste requis"),
  client_name: z.string().min(2, "Nom du client requis"),
  description: z.string().default(""),
  requirements: z
    .object({
      competences: z.array(z.string()).default([]),
      experience_min_annees: z.number().int().min(0).nullable().default(null),
      langues: z.array(z.string()).default([]),
      localisation: z.string().nullable().default(null),
      autres: z.string().nullable().default(null),
    })
    .prefault({}),
});

// M4 — Création d'un mandat.
export async function POST(request: NextRequest) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateMandateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mandates")
    .insert({
      agency_id: session.agency.id,
      title: parsed.data.title,
      client_name: parsed.data.client_name,
      description: parsed.data.description,
      requirements: parsed.data.requirements,
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "Création du mandat impossible." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, mandateId: data.id });
}
