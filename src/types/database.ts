// Types des tables Supabase (voir supabase/migrations/0001_schema.sql)

export interface Agency {
  id: string;
  name: string;
  branding: {
    primaryColor?: string;
    tagline?: string;
    logoUrl?: string;
  };
  created_at: string;
}

export interface Profile {
  id: string;
  agency_id: string;
  full_name: string | null;
  created_at: string;
}

export interface ExperienceItem {
  poste: string;
  entreprise: string;
  debut: string | null;
  fin: string | null;
  description: string | null;
}

export interface EducationItem {
  diplome: string;
  etablissement: string;
  annee: string | null;
}

export type CandidateStatus =
  | "nouveau"
  | "a_revoir"
  | "valide"
  | "archive"
  | "a_purger";

export interface Candidate {
  id: string;
  agency_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  languages: string[];
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  cv_file_url: string | null;
  source: string;
  status: CandidateStatus;
  consent_at: string;
  consent_text: string;
  retention_until: string;
  created_at: string;
}

export type MandateStatus =
  | "ouvert"
  | "shortlist_envoyee"
  | "gagne"
  | "perdu"
  | "ferme";

export interface Mandate {
  id: string;
  agency_id: string;
  title: string;
  client_name: string;
  description: string;
  requirements: {
    competences?: string[];
    experience_min_annees?: number;
    langues?: string[];
    localisation?: string;
    autres?: string;
  };
  status: MandateStatus;
  created_at: string;
}

export type MatchStage =
  | "propose"
  | "valide"
  | "presente"
  | "entretien"
  | "retenu"
  | "ecarte";

export interface Match {
  id: string;
  mandate_id: string;
  candidate_id: string;
  score: number;
  justification: string;
  recruiter_validated: boolean;
  stage: MatchStage;
  created_at: string;
}

export interface Shortlist {
  id: string;
  mandate_id: string;
  candidate_ids: string[];
  pdf_url: string | null;
  language: "fr" | "en";
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  candidate_id: string | null;
  actor: string;
  action: string;
  created_at: string;
}
