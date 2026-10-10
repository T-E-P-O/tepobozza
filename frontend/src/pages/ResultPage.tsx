import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInterventions, fetchBuildings } from '../services/api';
import { loadLastResult, saveAsScenario } from '../services/scenarioStore';
import type { InterventionOption, Building, OptimizationResult } from '../types';

export default function ResultPage() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [payload, setPayload] = useState<any | null>(null);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const last = loadLastResult();
    if (last) {
      setResult(last.result);
      setPayload(last.payload);
    }
    fetchInterventions().then(setOptions);
    fetchBuildings().then(setBuildings);
  }, []);

  if (!result) return <div className="card">Nessun risultato disponibile. Esegui uno scenario.</div>;

  const optionById = (id: string) => options.find((o) => o.id === id);
  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const explanationFor = (id: string) => result.explanations.find((e) => e.optionId === id);

  const saveSlot = (slot: 'A' | 'B') => {
    if (!payload) return;
    saveAsScenario(slot, slot === 'A' ? 'Scenario A' : 'Scenario B', payload, result);
    alert(`Salvato come Scenario ${slot}`);
  };

  return (
    <>
      <h1>Portafoglio proposto</h1>
      <p style={{ color: 'var(--tepo-muted)' }}>
        Stato solver: <strong>{result.solverStatus}</strong>
        {result.optimalityProven ? ' — ottimalità provata' : ''}
      </p>

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => saveSlot('A')}>Salva come Scenario A</button>
        <button onClick={() => saveSlot('B')}>Salva come Scenario B</button>
        <button onClick={() => navigate('/scenario?from=A')}>Duplica A come What-If</button>
        <button onClick={() => navigate('/scenario?from=B')}>Duplica B come What-If</button>
        <button onClick={() => navigate('/compare')}>Confronta A vs B</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Investimento totale</div><div className="value">€ {(result.totalInvestmentCents / 100).toLocaleString('it-IT')}</div></div>
        <div className="kpi"><div className="label">Budget residuo</div><div className="value">€ {(result.remainingBudgetCents / 100).toLocaleString('it-IT')}</div></div>
        <div className="kpi"><div className="label">Risparmio energetico</div><div className="value">{result.totalEnergySavingScaled.toLocaleString('it-IT')}</div></div>
        <div className="kpi"><div className="label">Risparmio economico</div><div className="value">€ {(result.totalEconomicSavingCents / 100).toLocaleString('it-IT')}</div></div>
        <div className="kpi"><div className="label">CO2 evitata</div><div className="value">{result.totalCo2ReductionScaled.toLocaleString('it-IT')} kg</div></div>
        <div className="kpi"><div className="label">Interventi selezionati</div><div className="value">{result.selectedOptionsId.length}</div></div>
      </div>

      <div className="card">
        <h3>Interventi selezionati</h3>
        <table>
          <thead>
            <tr><th>ID</th><th>Edificio</th><th>Intervento</th><th>Investimento</th><th>Risparmio energia</th><th>Motivazione</th></tr>
          </thead>
          <tbody>
            {result.selectedOptionsId.map((id) => {
              const o = optionById(id);
              const ex = explanationFor(id);
              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{o ? buildingName(o.buildingId) : '—'}</td>
                  <td>{o?.name ?? '—'}</td>
                  <td>€ {o ? (o.investmentCostCents / 100).toLocaleString('it-IT') : '—'}</td>
                  <td>{o?.annualEnergySavingScaled.toLocaleString('it-IT') ?? '—'}</td>
                  <td>{ex?.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Perché questa soluzione?</h3>
        <p>
          Obiettivo: massimizzazione del beneficio scelto; budget rispettato;
          numero candidati {payload?.candidateOptionIds?.length ?? '—'}; selezionati {result.selectedOptionsId.length}.
        </p>
        <h4>Perché alcuni interventi non sono stati selezionati?</h4>
        <ul>
          {result.excludedOptionsId.slice(0, 15).map((id) => {
            const ex = explanationFor(id);
            return <li key={id}><strong>{id}</strong>: {ex?.message ?? 'Motivazione non disponibile'}</li>;
          })}
        </ul>
      </div>
    </>
  );
}