/**
 * SPEC v2 §15.2 — JSON Regulatory Data.
 *
 * Exportiert den vollständigen Datensatz plus die abgeleiteten Artefakte
 * (Roadmap, Checklisten), damit nachgelagerte Systeme nichts nachrechnen müssen.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import type { Checklist, RoadmapItem } from "../domain/types.js";
import type { Clock } from "../time/clock.js";
import { REFERENCE_TIME_ZONE, systemClock } from "../time/clock.js";
import { buildRoadmap } from "../engine/roadmap.js";
import { generateAllChecklists } from "../engine/checklist.js";

export interface RegulatoryJsonExport {
  meta: {
    spec: string;
    generatedAt: string;
    referenceDate: string;
    timeZone: string;
    projectProfileId: string;
    disclaimer: string;
  };
  legalActs: RegulatoryDataset["legalActs"];
  sourceRecords: RegulatoryDataset["sourceRecords"];
  obligations: RegulatoryDataset["obligations"];
  complianceControls: RegulatoryDataset["complianceControls"];
  implementationTasks: RegulatoryDataset["implementationTasks"];
  legalTextSlots: RegulatoryDataset["legalTextSlots"];
  evidenceArtifacts: RegulatoryDataset["evidenceArtifacts"];
  auditEntries: RegulatoryDataset["auditEntries"];
  projectProfiles: RegulatoryDataset["projectProfiles"];
  applicabilityAssessments: RegulatoryDataset["applicabilityAssessments"];
  roadmapItems: RoadmapItem[];
  checklists: Checklist[];
}

export function buildJsonExport(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: { clock?: Clock } = {},
): RegulatoryJsonExport {
  const clock = options.clock ?? systemClock;
  return {
    meta: {
      spec: "SPEC v2 — Regulatory Roadmap & Compliance Engineering Module",
      generatedAt: clock.now(),
      referenceDate: clock.today(),
      timeZone: REFERENCE_TIME_ZONE,
      projectProfileId,
      disclaimer:
        "Kein Rechtsrat. Technisches Steuerungsdokument; alle regulatorischen Angaben sind " +
        "Arbeitsstand und an die referenzierten SourceRecords gebunden.",
    },
    legalActs: dataset.legalActs,
    sourceRecords: dataset.sourceRecords,
    obligations: dataset.obligations,
    complianceControls: dataset.complianceControls,
    implementationTasks: dataset.implementationTasks,
    legalTextSlots: dataset.legalTextSlots,
    evidenceArtifacts: dataset.evidenceArtifacts,
    auditEntries: dataset.auditEntries,
    projectProfiles: dataset.projectProfiles,
    applicabilityAssessments: dataset.applicabilityAssessments,
    roadmapItems: buildRoadmap(dataset, projectProfileId, { clock }),
    checklists: generateAllChecklists(dataset, projectProfileId),
  };
}

export function renderJsonExport(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: { clock?: Clock } = {},
): string {
  return `${JSON.stringify(buildJsonExport(dataset, projectProfileId, options), null, 2)}\n`;
}
