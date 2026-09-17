/**
 * Synthetische Fixtures für die Engine-Tests.
 *
 * Sie sind bewusst vom Seed getrennt: Die Seed-Daten bilden einen realen
 * Arbeitsstand ab, die Fixtures gezielt einzelne Regelzweige aus §7–§10.
 */
import type { RegulatoryDataset } from "../../src/domain/dataset.js";
import { emptyDataset } from "../../src/domain/dataset.js";
import type { ControlImplementationState, RegulatoryLifecycleState } from "../../src/domain/lifecycle-states.js";
import type {
  ComplianceControl,
  EvidenceArtifact,
  LegalAct,
  LegalTextSlot,
  Obligation,
  ProjectProfile,
} from "../../src/domain/types.js";
import { demoShopProfile } from "../../src/data/project-profiles.js";

export const TEST_TODAY = "2026-09-16";

export interface FixtureOptions {
  lifecycleState?: RegulatoryLifecycleState;
  /** Wird als `applicableDate` gesetzt und bestimmt damit den deadlineHint. */
  applicableDate?: string;
  transitionEnd?: string;
  sourceRecords?: string[];
  requiresLegalText?: boolean;
  requiresEvidence?: boolean;
  obligationNeedsLegalReview?: boolean;
  prepareArchitectureOnly?: boolean;
  controlStates?: ControlImplementationState[];
  controlOwners?: Array<string | undefined>;
  slotApproved?: boolean;
  /** Freigegebener Slot, dem die Begleitfelder aus F-11 fehlen. */
  slotApprovedIncomplete?: boolean;
  evidenceApproved?: boolean;
  assessment?: {
    applicable?: boolean;
    confidence?: "high" | "medium" | "low";
    needsLegalReview?: boolean;
  };
  profile?: ProjectProfile;
}

/** Baut einen Ein-Rechtsakt-Datensatz mit voller Kette LegalAct → Evidence. */
export function makeDataset(options: FixtureOptions = {}): RegulatoryDataset {
  const dataset = emptyDataset();
  const profile = options.profile ?? demoShopProfile;
  const sourceRecords = options.sourceRecords ?? ["src-test"];
  const controlStates = options.controlStates ?? ["not_started"];

  dataset.projectProfiles.push(profile);
  if (sourceRecords.includes("src-test")) {
    dataset.sourceRecords.push({
      id: "src-test",
      sourceSystem: "Manual",
      documentType: "guidance",
      officialIdentifier: "TEST-1",
      retrievedAt: TEST_TODAY,
      confidence: "high",
    });
  }

  const act: LegalAct = {
    id: "act-test",
    slug: "BFSG",
    name: "Testrechtsakt",
    shortName: "TEST",
    jurisdiction: "DE",
    sourceRecords,
    lifecycleState: options.lifecycleState ?? "applicable",
    reviewStatus: "draft",
    ...(options.applicableDate !== undefined ? { applicableDate: options.applicableDate } : {}),
    ...(options.transitionEnd !== undefined ? { transitionEnd: options.transitionEnd } : {}),
  };
  dataset.legalActs.push(act);

  const obligation: Obligation = {
    id: "obl-test",
    legalActId: act.id,
    title: "Testpflicht",
    sourceRecords,
    affectedLayers: ["frontend"],
    lifecycleState: act.lifecycleState,
    actionableNow: true,
    prepareArchitectureOnly: options.prepareArchitectureOnly ?? false,
    requiresLegalText: options.requiresLegalText ?? true,
    requiresEvidence: options.requiresEvidence ?? true,
    needsLegalReview: options.obligationNeedsLegalReview ?? false,
  };
  dataset.obligations.push(obligation);

  controlStates.forEach((state, index) => {
    const owner = options.controlOwners?.[index];
    const control: ComplianceControl = {
      id: `ctl-test-${index}`,
      obligationId: obligation.id,
      title: `Testkontrolle ${index}`,
      controlType: "ui_component",
      implementationState: state,
      dependsOnPublication: false,
      dependsOnLegalText: true,
      ...(owner !== undefined ? { ownerRole: owner } : {}),
    };
    dataset.complianceControls.push(control);
  });

  const slot: LegalTextSlot = {
    id: "slot-test",
    obligationId: obligation.id,
    slotKey: "bfsg.accessibility_statement",
    placement: "footer",
    textSource: options.slotApproved || options.slotApprovedIncomplete ? "law_firm" : "not_set",
    status: options.slotApproved || options.slotApprovedIncomplete ? "approved" : "empty",
    ...(options.slotApproved
      ? {
          approvedBy: "legal@example.test",
          approvedAt: TEST_TODAY,
          sourceReference: "Kanzleifreigabe 2026-09-16",
        }
      : {}),
  };
  dataset.legalTextSlots.push(slot);

  const evidence: EvidenceArtifact = {
    id: "ev-test",
    obligationId: obligation.id,
    type: "audit_report",
    createdAt: TEST_TODAY,
    status: options.evidenceApproved === true ? "approved" : "collected",
  };
  dataset.evidenceArtifacts.push(evidence);

  dataset.applicabilityAssessments.push({
    id: "asmt-test",
    legalActId: act.id,
    projectProfileId: profile.id,
    applicable: options.assessment?.applicable ?? true,
    confidence: options.assessment?.confidence ?? "high",
    reasons: ["Fixture"],
    needsLegalReview: options.assessment?.needsLegalReview ?? false,
    assessedAt: TEST_TODAY,
  });

  return dataset;
}

/** Datum relativ zum Test-Stichtag, als ISO-Datum. */
export function inDays(days: number): string {
  const base = Date.parse(`${TEST_TODAY}T00:00:00Z`);
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}
