import { useEffect, useState } from 'react';
import { loadScenario, type StoredScenario } from '../services/scenarioStore';
import { fetchInterventions, fetchBuildings } from '../services/api';
import type { InterventionOption, Building } from '../types';

export default function ComparePage() {
  const [a, setA] = useState<StoredScenario | null>(null);
  const [b, setB] = useState<StoredScenario | null>(null);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    setA(loadScenario('A'));
    setB(loadScenario('B'));
    fetchInterventions().then(setOptions);
    fetchBuildings().then(setBuildings);
  }, []);

  if (!a || !b) {
    return (
      <div className="card">
        <h1>Confronto scenari</h1>
        <p>Servono due scenari salvati. Esegui due ottimizzazioni e salva ciascuna come A e B.</p>
      </div>
    );
  }

  const fEur = (c: number) => `€ ${(c / 100).toLocaleString('it-IT')}`;
  const fNum = (n: number) => n.toLocaleString('it-IT');
  const optionName = (id: string) => options.find((o) => o.id === id)?.name ?? id;
  const buildingOf = (id: string) => {
    const o = options.find((x) => x.id === id);
    return o ? (buildings.find((b) => b.id === o.buildingId)?.name ?? o.buildingId) : '—';
  };

  const added = b.result.selectedOptionsId.filter((id) => !a.result.selectedOptionsId.includes(id));
  const removed = a.result.selectedOptionsId.filter((id) => !b.result.selectedOptionsId.includes(id));

  const rows: [string, string, string][] = [
    ['Budget', fEur(a.payload.budgetCents), fEur(b.payload.budgetCents)],
    ['Obiettivo', a.payload.objective, b.payload.objective],
    ['Investimento', fEur(a.result.totalInvestmentCents), fEur(b.result.totalInvestmentCents)],
    ['Budget residuo', fEur(a.result.remainingBudgetCents), fEur(b.result.remainingBudgetCents)],
    ['Risparmio energetico', fNum(a.result.totalEnergySavingScaled), fNum(b.result.totalEnergySavingScaled)],
    ['Risparmio economico', fEur(a.result.totalEconomicSavingCents), fEur(b.result.totalEconomicSavingCents)],
    ['CO2 evitata (kg)', fNum(a.result.totalCo2ReductionScaled), fNum(b.result.totalCo2ReductionScaled)],
    ['Interventi selezionati', String(a.result.selectedOptionsId.length), String(b.result.selectedOptionsId.length)],
    ['Stato solver', a.result.solverStatus, b.result.solverStatus]
  ];

  return (
    <>
      <h1>Confronto scenari</h1>
      <div className="card">
        <table>
          <thead><tr><th>Metrica</th><th>Scenario A</th><th>Scenario B</th></tr></thead>
          <tbody>
            {rows.map(([k, va, vb]) => (
              <tr key={k}><td><strong>{k}</strong></td><td>{va}</td><td>{vb}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Interventi aggiunti in B</h3>
        {added.length === 0 ? <p>Nessuno.</p> : (
          <table>
            <thead><tr><th>ID</th><th>Edificio</th><th>Intervento</th></tr></thead>
            <tbody>
              {added.map((id) => (
                <tr key={id}><td>{id}</td><td>{buildingOf(id)}</td><td>{optionName(id)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Interventi rimossi in B</h3>
        {removed.length === 0 ? <p>Nessuno.</p> : (
          <table>
            <thead><tr><th>ID</th><th>Edificio</th><th>Intervento</th></tr></thead>
            <tbody>
              {removed.map((id) => (
                <tr key={id}><td>{id}</td><td>{buildingOf(id)}</td><td>{optionName(id)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}