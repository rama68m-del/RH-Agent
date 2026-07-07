import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client service role — SERVEUR UNIQUEMENT (bypass RLS).
// Utilisé pour l'intake public (candidat non authentifié) et le journal d'audit.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
