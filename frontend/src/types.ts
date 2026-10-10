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