import type {
  AiStatus,
  Building,
  InterventionOption,
  OptimizationResult,
  ScenarioProposalDto
} from '../types';

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