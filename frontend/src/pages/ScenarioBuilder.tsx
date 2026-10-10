import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInterventions, optimizeScenario, type OptimizePayload } from '../services/api';
import { saveAsScenario, saveLastResult, loadScenario } from '../services/scenarioStore';
import type { InterventionOption } from '../types';

export default function ScenarioBuilder() {
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [budgetEur, setBudgetEur] = useState(500000);
  const [objective, setObjective] = useState('ENERGY_SAVING');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxNumber, setMaxNumber] = useState<number | ''>('');
  const [slot, setSlot] = useState<'A' | 'B' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterventions().then((list) => {
      setOptions(list);
      setSelected(new Set(list.map((o) => o.id)));
    });

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from === 'A' || from === 'B') {
      const s = loadScenario(from);
      if (s) {
        setBudgetEur(s.payload.budgetCents / 100);
        setObjective(s.payload.objective);
        setSelected(new Set(s.payload.candidateOptionIds));
        setMaxNumber(s.payload.maxNumber ?? '');
        setSlot(from === 'A' ? 'B' : 'A');
      }
    }
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: OptimizePayload = {
        budgetCents: Math.round(budgetEur * 100),
        objective,
        candidateOptionIds: Array.from(selected),
        incompatibilities: [['OPT-001', 'OPT-021']],
        prerequisites: [['OPT-014', 'OPT-013']],
        maxNumber: maxNumber === '' ? null : Number(maxNumber),
        maxNumberOptionIds: maxNumber === '' ? [] : Array.from(selected)
      };
      const result = await optimizeScenario('SCN-DEMO', payload);
      saveLastResult(payload, result);
      if (slot === 'A' || slot === 'B') {
        const name = slot === 'A' ? 'Scenario A' : 'Scenario B';
        saveAsScenario(slot, name, payload, result);
      }
      navigate('/result');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Scenario Builder</h1>
      <p style={{ color: 'var(--tepo-muted)' }}>
        Configura budget, obiettivo e vincoli. Il solver calcola il portafoglio proposto.
      </p>

      <div className="card">
        <label>
          <span>Salva come</span>
          <select value={slot} onChange={(e) => setSlot(e.target.value as any)}>
            <option value="">Non salvare</option>
            <option value="A">Scenario A</option>
            <option value="B">Scenario B</option>
          </select>
        </label>
        <label>
          <span>Budget (EUR)</span>
          <input type="number" min={0} value={budgetEur} onChange={(e) => setBudgetEur(Number(e.target.value))} />
        </label>
        <label>
          <span>Obiettivo</span>
          <select value={objective} onChange={(e) => setObjective(e.target.value)}>
            <option value="ENERGY_SAVING">Risparmio energetico</option>
            <option value="ECONOMIC_SAVING">Risparmio economico</option>
            <option value="CO2_REDUCTION">Riduzione CO2</option>
          </select>
        </label>
        <label>
          <span>Numero massimo di interventi (opzionale)</span>
          <input type="number" min={0} value={maxNumber}
                 onChange={(e) => setMaxNumber(e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      </div>

      <div className="card">
        <h3>Interventi considerati ({selected.size}/{options.length})</h3>
        <table>
          <thead><tr><th></th><th>ID</th><th>Nome</th><th>Costo</th><th>Beneficio energia</th></tr></thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.id}>
                <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td>
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>€ {(o.investmentCostCents / 100).toLocaleString('it-IT')}</td>
                <td>{o.annualEnergySavingScaled.toLocaleString('it-IT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="card" style={{ color: 'crimson' }}>{error}</div>}

      <button onClick={run} disabled={loading || selected.size === 0}>
        {loading ? 'Ottimizzazione del portafoglio in corso...' : 'Ottimizza portafoglio'}
      </button>
    </>
  );
}