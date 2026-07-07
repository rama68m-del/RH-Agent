import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Agency, Candidate, Mandate, Match } from "@/types/database";

// Libellés FR/EN du livrable client
const LABELS = {
  fr: {
    title: "Shortlist candidats",
    mandate: "Poste",
    client: "Client",
    date: "Date",
    comparison: "Tableau comparatif",
    name: "Candidat",
    score: "Score",
    skills: "Compétences clés",
    location: "Localisation",
    languages: "Langues",
    why: "Pourquoi ce candidat",
    strengths: "Points forts",
    watchouts: "Points de vigilance",
    experience: "Expérience",
    education: "Formation",
    footer:
      "Document confidentiel — préparé par le cabinet. Matching par compétences assisté par IA, validé par un consultant.",
    noFee: "Aucun paiement n'est jamais exigé des candidats.",
    current: "en cours",
  },
  en: {
    title: "Candidate shortlist",
    mandate: "Position",
    client: "Client",
    date: "Date",
    comparison: "Comparison table",
    name: "Candidate",
    score: "Score",
    skills: "Key skills",
    location: "Location",
    languages: "Languages",
    why: "Why this candidate",
    strengths: "Strengths",
    watchouts: "Points of attention",
    experience: "Experience",
    education: "Education",
    footer:
      "Confidential document — prepared by the agency. AI-assisted skills-based matching, validated by a consultant.",
    noFee: "Candidates are never charged any fee.",
    current: "current",
  },
} as const;

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1c1917" },
  header: { marginBottom: 16, paddingBottom: 10, borderBottom: "2 solid #0f766e" },
  agencyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f766e" },
  tagline: { fontSize: 9, color: "#57534e", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 12 },
  meta: { fontSize: 9, color: "#57534e", marginTop: 4 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
    color: "#0f766e",
  },
  table: { borderTop: "1 solid #d6d3d1", borderLeft: "1 solid #d6d3d1" },
  row: { flexDirection: "row" },
  cellHeader: {
    flex: 1,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    backgroundColor: "#f5f5f4",
    borderRight: "1 solid #d6d3d1",
    borderBottom: "1 solid #d6d3d1",
  },
  cell: {
    flex: 1,
    padding: 4,
    fontSize: 8,
    borderRight: "1 solid #d6d3d1",
    borderBottom: "1 solid #d6d3d1",
  },
  candidateCard: {
    marginTop: 10,
    padding: 10,
    border: "1 solid #d6d3d1",
    borderRadius: 4,
  },
  candidateName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  scoreBadge: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f766e" },
  label: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 6 },
  text: { fontSize: 9, lineHeight: 1.4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#78716c",
    borderTop: "1 solid #d6d3d1",
    paddingTop: 6,
  },
});

export interface ShortlistEntry {
  candidate: Candidate;
  match: Match & { points_forts?: string[]; points_de_vigilance?: string[] };
}

export interface ShortlistDocumentProps {
  agency: Agency;
  mandate: Mandate;
  entries: ShortlistEntry[];
  language: "fr" | "en";
}

export function ShortlistDocument({
  agency,
  mandate,
  entries,
  language,
}: ShortlistDocumentProps) {
  const t = LABELS[language];
  const brand = agency.branding?.primaryColor ?? "#0f766e";
  const today = new Date().toLocaleDateString(
    language === "fr" ? "fr-FR" : "en-GB"
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: brand }]}>
          <Text style={[styles.agencyName, { color: brand }]}>
            {agency.name}
          </Text>
          {agency.branding?.tagline ? (
            <Text style={styles.tagline}>{agency.branding.tagline}</Text>
          ) : null}
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.meta}>
            {t.mandate} : {mandate.title}   •   {t.client} :{" "}
            {mandate.client_name}   •   {t.date} : {today}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: brand }]}>
          {t.comparison}
        </Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cellHeader, { flex: 1.4 }]}>{t.name}</Text>
            <Text style={[styles.cellHeader, { flex: 0.5 }]}>{t.score}</Text>
            <Text style={[styles.cellHeader, { flex: 2 }]}>{t.skills}</Text>
            <Text style={styles.cellHeader}>{t.location}</Text>
            <Text style={styles.cellHeader}>{t.languages}</Text>
          </View>
          {entries.map(({ candidate, match }) => (
            <View style={styles.row} key={candidate.id}>
              <Text style={[styles.cell, { flex: 1.4 }]}>
                {candidate.full_name}
              </Text>
              <Text style={[styles.cell, { flex: 0.5 }]}>
                {match.score}/100
              </Text>
              <Text style={[styles.cell, { flex: 2 }]}>
                {candidate.skills.slice(0, 6).join(", ")}
              </Text>
              <Text style={styles.cell}>{candidate.location ?? "—"}</Text>
              <Text style={styles.cell}>{candidate.languages.join(", ")}</Text>
            </View>
          ))}
        </View>

        {entries.map(({ candidate, match }) => (
          <View style={styles.candidateCard} key={candidate.id} wrap={false}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.candidateName}>{candidate.full_name}</Text>
              <Text style={[styles.scoreBadge, { color: brand }]}>
                {match.score}/100
              </Text>
            </View>

            <Text style={styles.label}>{t.why}</Text>
            <Text style={styles.text}>{match.justification}</Text>

            {match.points_forts && match.points_forts.length > 0 ? (
              <>
                <Text style={styles.label}>{t.strengths}</Text>
                {match.points_forts.map((p, i) => (
                  <Text style={styles.text} key={i}>
                    • {p}
                  </Text>
                ))}
              </>
            ) : null}

            {match.points_de_vigilance &&
            match.points_de_vigilance.length > 0 ? (
              <>
                <Text style={styles.label}>{t.watchouts}</Text>
                {match.points_de_vigilance.map((p, i) => (
                  <Text style={styles.text} key={i}>
                    • {p}
                  </Text>
                ))}
              </>
            ) : null}

            <Text style={styles.label}>{t.experience}</Text>
            {candidate.experience.slice(0, 4).map((e, i) => (
              <Text style={styles.text} key={i}>
                • {e.poste} — {e.entreprise} ({e.debut ?? "?"} →{" "}
                {e.fin ?? t.current})
              </Text>
            ))}

            <Text style={styles.label}>{t.education}</Text>
            {candidate.education.slice(0, 3).map((e, i) => (
              <Text style={styles.text} key={i}>
                • {e.diplome} — {e.etablissement} {e.annee ? `(${e.annee})` : ""}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          {t.footer} {t.noFee}
        </Text>
      </Page>
    </Document>
  );
}
