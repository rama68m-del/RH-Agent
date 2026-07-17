import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { parseCv } from "@/services/ai/parsing";
import { logAudit } from "@/services/audit";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// M2 — Lance le parsing Claude du CV d'un candidat.
// Renvoie le profil structuré SANS l'enregistrer : le recruteur revoit
// et corrige dans l'écran de revue avant sauvegarde.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const supabase = await createClient();
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, cv_file_url")
    .eq("id", id)
    .single();
  if (!candidate) {
    return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
  }
  if (!candidate.cv_file_url) {
    return NextResponse.json(
      { error: "Aucun CV n'est associé à ce candidat." },
      { status: 400 }
    );
  }

  try {
    // Le recruteur télécharge le CV via sa session (politique RLS Storage)
    const { data: blob, error: dlError } = await supabase.storage
      .from("cvs")
      .download(candidate.cv_file_url);
    if (dlError || !blob) {
      return NextResponse.json(
        { error: "Téléchargement du CV impossible." },
        { status: 500 }
      );
    }

    const ext = candidate.cv_file_url.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = blob.type || MIME_BY_EXT[ext] || "application/pdf";
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

    const profile = await parseCv(base64, mimeType);

    await logAudit(
      supabase,
      id,
      session.email,
      "parsing IA du CV (proposition de profil)"
    );

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Le parsing a échoué.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
