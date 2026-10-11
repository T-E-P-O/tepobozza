export type Building = {
  id: string;
  name: string;
  address: string;
  municipality: string;
  latitude: number;
  longitude: number;
  buildingType: string;
  surfaceM2: number;
  provenance: string;
};

export type InterventionOption = {
  id: string;
  buildingId: string;
  interventionTypeId: string;
  name: string;
  investmentCostCents: number;
  annualEnergySavingScaled: number;
  annualEconomicSavingCents: number;
  annualCo2ReductionScaled: number;
  provenance: string;
};

export type Explanation = {
  optionId: string;
  reasonCode: string;
  message: string;
};

export type OptimizationResult = {
  runId: string;
  problemHash: string;
  selectedOptionsId: string[];
  excludedOptionsId: string[];
  totalInvestmentCents: number;
  remainingBudgetCents: number;
  objectiveValue: number;
  totalEnergySavingScaled: number;
  totalEconomicSavingCents: number;
  totalCo2ReductionScaled: number;
  solverStatus: string;
  optimalityProven: boolean;
  canonicalTieBreakCompleted: boolean;
  explanations: Explanation[];
};

/* ---- Assistente AI ---- */

export type ScenarioProposalSource = 'RULE_BASED' | 'LLM' | 'LLM_FALLBACK_RULE_BASED';

/**
 * Proposta di parametri di scenario. Non è un comando: richiede sempre
 * approvazione umana prima di essere applicata al form di ScenarioBuilder.
 */
export type ScenarioProposalDto = {
  budgetCents: number;
  objective: string;
  candidateOptionIds: string[];
  explanation: string;
  source: ScenarioProposalSource;
  missingInformation: string[];
  warnings: string[];
  requiresHumanReview: boolean;
};

export type AiStatus = {
  llmConfigured: boolean;
  activeProvider: string;
  notes: string[];
};