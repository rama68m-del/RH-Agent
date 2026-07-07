import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";

const UpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  location: z.string().nullable().optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        poste: z.string(),
        entreprise: z.string(),
        debut: z.string().nullable(),
        fin: z.string().nullable(),
        description: z.string().nullable(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        diplome: z.string(),
        etablissement: z.string(),
        annee: z.string().nullable(),
      })
    )
    .optional(),
  status: z
    .enum(["nouveau", "a_revoir", "valide", "archive", "a_purger"])
    .optional(),
});

// M2 — Sauvegarde du profil revu/corrigé par le recruteur.
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
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: `Mise à jour impossible : ${error.message}` },
      { status: 400 }
    );
  }

  await logAudit(id, session.email, "mise à jour du profil candidat (revue humaine)");
  return NextResponse.json({ ok: true });
}
