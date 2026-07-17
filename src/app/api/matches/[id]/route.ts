import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";

const UpdateMatchSchema = z.object({
  recruiter_validated: z.boolean().optional(),
  stage: z
    .enum(["propose", "valide", "presente", "entretien", "retenu", "ecarte"])
    .optional(),
});

// M4 — Validation humaine d'une proposition de matching, ou changement
// d'étape dans le pipeline. C'est LE clic qui autorise la présentation client.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = UpdateMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  // Valider = passer aussi l'étape à "valide" ; dévalider = retour à "propose"
  if (parsed.data.recruiter_validated === true && !parsed.data.stage) {
    update.stage = "valide";
  }
  if (parsed.data.recruiter_validated === false && !parsed.data.stage) {
    update.stage = "propose";
  }

  const supabase = await createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .update(update)
    .eq("id", id)
    .select("candidate_id, recruiter_validated, stage")
    .single();
  if (error || !match) {
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 400 }
    );
  }

  await logAudit(
    supabase,
    match.candidate_id,
    session.email,
    match.recruiter_validated
      ? `validation humaine du match (étape : ${match.stage})`
      : `mise à jour du match (étape : ${match.stage})`
  );

  return NextResponse.json({ ok: true });
}
