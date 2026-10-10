import type { OptimizationResult } from '../types';
import type { OptimizePayload } from './api';

export type StoredScenario = {
  id: 'A' | 'B';
  name: string;
  payload: OptimizePayload;
  result: OptimizationResult;
  createdAt: string;
};

const KEY_A = 'tepo:scenarioA';
const KEY_B = 'tepo:scenarioB';
const KEY_LAST = 'tepo:lastResult';

export function saveAsScenario(slot: 'A' | 'B', name: string, payload: OptimizePayload, result: OptimizationResult) {
  const data: StoredScenario = {
    id: slot,
    name,
    payload,
    result,
    createdAt: new Date().toISOString()
  };
  sessionStorage.setItem(slot === 'A' ? KEY_A : KEY_B, JSON.stringify(data));
}

export function loadScenario(slot: 'A' | 'B'): StoredScenario | null {
  const raw = sessionStorage.getItem(slot === 'A' ? KEY_A : KEY_B);
  return raw ? JSON.parse(raw) : null;
}

export function saveLastResult(payload: OptimizePayload, result: OptimizationResult) {
  sessionStorage.setItem(KEY_LAST, JSON.stringify({ payload, result }));
}

export function loadLastResult(): { payload: OptimizePayload; result: OptimizationResult } | null {
  const raw = sessionStorage.getItem(KEY_LAST);
  return raw ? JSON.parse(raw) : null;
}

export function clearAll() {
  sessionStorage.removeItem(KEY_A);
  sessionStorage.removeItem(KEY_B);
  sessionStorage.removeItem(KEY_LAST);
}