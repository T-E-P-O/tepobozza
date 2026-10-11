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

  const toggleAll = () => {
    if (selected.size === options.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(options.map((o) => o.id)));
    }
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

  const totalCostEur = options.reduce((s, o) => s + o.investmentCostCents, 0) / 100;

  return (
    <div className="tepo-stack tepo-stack--loose">
      <header>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-semibold)'
          }}
        >
          Scenario Builder
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Configura budget, obiettivo e vincoli. Il solver calcola il portafoglio proposto.
        </p>
      </header>

      {/* ---- Configurazione scenario ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Parametri dello scenario</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)'
          }}
        >
          <label className="tepo-field">
            <span className="tepo-field__label">Salva come</span>
            <select
              className="tepo-select"
              value={slot}
              onChange={(e) => setSlot(e.target.value as any)}
            >
              <option value="">Non salvare</option>
              <option value="A">Scenario A</option>
              <option value="B">Scenario B</option>
            </select>
            <span className="tepo-field__help">
              Salva il risultato per il confronto What-If.
            </span>
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Budget (EUR)</span>
            <input
              className="tepo-input"
              type="number"
              min={0}
              value={budgetEur}
              onChange={(e) => setBudgetEur(Number(e.target.value))}
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Obiettivo</span>
            <select
              className="tepo-select"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            >
              <option value="ENERGY_SAVING">Risparmio energetico</option>
              <option value="ECONOMIC_SAVING">Risparmio economico</option>
              <option value="CO2_REDUCTION">Riduzione CO2</option>
            </select>
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Numero massimo di interventi</span>
            <input
              className="tepo-input"
              type="number"
              min={0}
              placeholder="Nessun limite"
              value={maxNumber}
              onChange={(e) =>
                setMaxNumber(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
            <span className="tepo-field__help">Opzionale. Vuoto = nessun limite.</span>
          </label>
        </div>
      </section>

      {/* ---- Tabella interventi candidati ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <div>
            <h2 className="tepo-card__title">Interventi considerati</h2>
            <p className="tepo-card__subtitle">
              {selected.size} di {options.length} selezionati — costo totale catalogo € {totalCostEur.toLocaleString('it-IT')}
            </p>
          </div>
          <button
            className="tepo-button tepo-button--secondary tepo-button--sm"
            onClick={toggleAll}
          >
            {selected.size === options.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table className="tepo-table tepo-table--compact">
            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>ID</th>
                <th>Nome</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Beneficio energia</th>
              </tr>
            </thead>
            <tbody>
              {options.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleziona ${o.name}`}
                    />
                  </td>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                    {o.id}
                  </td>
                  <td>{o.name}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    € {(o.investmentCostCents / 100).toLocaleString('it-IT')}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {o.annualEnergySavingScaled.toLocaleString('it-IT')}
                  </td>
                </tr>
              ))}
              {options.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-6)' }}>
                    Nessun intervento nel catalogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Errore ---- */}
      {error && (
        <div
          className="tepo-card"
          role="alert"
          style={{
            borderColor: 'var(--color-brand-danger)',
            color: 'var(--color-state-danger-fg)',
            background: 'var(--color-state-danger-bg)'
          }}
        >
          <strong>Errore ottimizzazione:</strong> {error}
        </div>
      )}

      {/* ---- Azione ---- */}
      <div className="tepo-cluster">
        <button
          className="tepo-button tepo-button--primary tepo-button--lg"
          onClick={run}
          disabled={loading || selected.size === 0}
        >
          {loading ? 'Ottimizzazione del portafoglio in corso…' : 'Ottimizza portafoglio'}
        </button>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {selected.size} interventi candidati · budget € {budgetEur.toLocaleString('it-IT')}
        </span>
      </div>
    </div>
  );
}