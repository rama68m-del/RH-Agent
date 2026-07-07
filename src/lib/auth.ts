import { createClient } from "@/lib/supabase/server";
import type { Agency, Profile } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile;
  agency: Agency;
}

// Récupère le recruteur connecté + son agence (null si non connecté
// ou profil non rattaché à une agence).
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", profile.agency_id)
    .single();
  if (!agency) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as Profile,
    agency: agency as Agency,
  };
}
