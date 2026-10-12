import type { AiStatus, Building, InterventionOption, OptimizationResult,
  ScenarioProposalDto, SensitivityResult } from '../types';

const BASE = '/api';

export async function fetchBuildings(): Promise<Building[]> {
  const r = await fetch(`${BASE}/buildings`);
  if (!r.ok) throw new Error('Errore caricamento edifici');
  return r.json();
}

export async function fetchInterventions(): Promise<InterventionOption[]> {
  const r = await fetch(`${BASE}/interventions`);
  if (!r.ok) throw new Error('Errore caricamento interventi');
  return r.json();
}

export type OptimizePayload = {
  budgetCents: number;
  objective: string;
  candidateOptionIds: string[];
  incompatibilities: string[][];
  prerequisites: string[][];
  maxNumber: number | null;
  maxNumberOptionIds: string[];
};

export async function optimizeScenario(
  scenarioId: string,
  payload: OptimizePayload
): Promise<OptimizationResult> {
  const r = await fetch(`${BASE}/scenarios/${scenarioId}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Errore ottimizzazione: ${text}`);
  }
  return r.json();
}

/* ---- Assistente AI ---- */

export async function fetchAiStatus(): Promise<AiStatus> {
  const r = await fetch(`${BASE}/ai/status`);
  if (!r.ok) {
    throw new Error('Errore stato assistente AI');
  }
  return r.json();
}

export async function proposeWithAi(text: string): Promise<ScenarioProposalDto> {
  const r = await fetch(`${BASE}/ai/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(
      body && body.length > 0 ? `Errore assistente AI: ${body}` : 'Errore assistente AI'
    );
  }
  return r.json();
}

/* ---- Analisi di sensibilità ---- */

export type SensitivityRequest = {
  baseBudgetCents: number;
  objective: string;
  candidateOptionIds: string[];
  points?: number;
  minFactor?: number;
  maxFactor?: number;
};

export async function runSensitivityBudget(
  scenarioId: string,
  payload: SensitivityRequest
): Promise<SensitivityResult> {
  const r = await fetch(`${BASE}/sensitivity/${scenarioId}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(body && body.length > 0
      ? `Errore analisi di sensibilità: ${body}`
      : 'Errore analisi di sensibilità');
  }
  return r.json();
}