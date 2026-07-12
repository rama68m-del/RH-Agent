import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client service role — SERVEUR UNIQUEMENT (bypass RLS).
// Utilisé pour l'intake public (candidat non authentifié) et le journal d'audit.
// Alias `supabase` accepté : nom utilisé dans les variables d'environnement Vercel.
export function createAdminClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase;
  if (!serviceRoleKey) {
    throw new Error(
      "Configuration manquante : SUPABASE_SERVICE_ROLE_KEY (ou `supabase`) doit être définie."
    );
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
