import { NextRequest, NextResponse } from "next/server";
import {
  createCandidateFromIntake,
  IntakeSchema,
} from "@/services/candidates";

// M1 — Dépôt de candidature public (candidat non authentifié).
// Champs multipart : agency_id, full_name, phone, email?, location?,
// consent ("true"), consent_text, cv (fichier PDF/photo).
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const parsed = IntakeSchema.safeParse({
      agency_id: form.get("agency_id"),
      full_name: form.get("full_name"),
      phone: form.get("phone"),
      email: form.get("email") ?? "",
      location: form.get("location") ?? "",
      consent: form.get("consent"),
      consent_text: form.get("consent_text"),
    });
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Formulaire incomplet.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const file = form.get("cv");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Le CV est obligatoire (PDF ou photo)." },
        { status: 400 }
      );
    }

    const result = await createCandidateFromIntake({
      agency_id: parsed.data.agency_id,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      location: parsed.data.location || undefined,
      consent_text: parsed.data.consent_text,
      file: {
        bytes: await file.arrayBuffer(),
        type: file.type,
        name: file.name,
      },
    });

    return NextResponse.json({
      ok: true,
      candidateId: result.candidateId,
      duplicateWarning: result.duplicateWarning,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
