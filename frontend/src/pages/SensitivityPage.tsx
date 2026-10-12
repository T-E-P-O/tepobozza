import { useEffect, useMemo, useState } from 'react';
import { fetchInterventions, runSensitivityBudget } from '../services/api';
import type { InterventionOption, SensitivityResult } from '../types';

const OBJECTIVE_LABELS: Record<string, string> = {
  ENERGY_SAVING: 'Risparmio energetico',
  ECONOMIC_SAVING: 'Risparmio economico',
  CO2_REDUCTION: 'Riduzione CO2'
};

function fmtEur(cents: number): string {
  return `€ ${(cents / 100).toLocaleString('it-IT')}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('it-IT');
}

export default function SensitivityPage() {
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [budgetEur, setBudgetEur] = useState(500000);
  const [objective, setObjective] = useState('ENERGY_SAVING');
  const [points, setPoints] = useState(11);
  const [minFactor, setMinFactor] = useState(0.5);
  const [maxFactor, setMaxFactor] = useState(1.5);

  const [result, setResult] = useState<SensitivityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterventions().then((list) => {
      setOptions(list);
      setSelected(new Set(list.map((o) => o.id)));
    });
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === options.length) setSelected(new Set());
    else setSelected(new Set(options.map((o) => o.id)));
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await runSensitivityBudget('SCN-DEMO', {
        baseBudgetCents: Math.round(budgetEur * 100),
        objective,
        candidateOptionIds: Array.from(selected),
        points,
        minFactor,
        maxFactor
      });
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const maxSelected = useMemo(
    () => (result ? Math.max(1, ...result.grid.map((p) => p.numSelected)) : 1),
    [result]
  );

  const optionName = (id: string) =>
    options.find((o) => o.id === id)?.name ?? id;

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
          Analisi di sensibilità
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Sweep deterministico sul budget. Non è una simulazione Monte Carlo:
          varia un solo parametro su una griglia definita. Ogni punto è una
          nuova ottimizzazione indipendente.
        </p>
      </header>

      {/* ---- Form ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Parametri dello sweep</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)'
          }}
        >
          <label className="tepo-field">
            <span className="tepo-field__label">Budget base (EUR)</span>
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
            <span className="tepo-field__label">Numero di punti (3–51)</span>
            <input
              className="tepo-input"
              type="number"
              min={3}
              max={51}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Fattore minimo</span>
            <input
              className="tepo-input"
              type="number"
              step={0.05}
              min={0.01}
              value={minFactor}
              onChange={(e) => setMinFactor(Number(e.target.value))}
            />
            <span className="tepo-field__help">Es. 0.5 = metà del budget base</span>
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Fattore massimo</span>
            <input
              className="tepo-input"
              type="number"
              step={0.05}
              min={0.01}
              value={maxFactor}
              onChange={(e) => setMaxFactor(Number(e.target.value))}
            />
            <span className="tepo-field__help">Es. 1.5 = una volta e mezza</span>
          </label>
        </div>

        <div className="tepo-card__footer" style={{ marginTop: 'var(--space-4)' }}>
          <button
            className="tepo-button tepo-button--primary"
            onClick={run}
            disabled={loading || selected.size === 0}
          >
            {loading ? 'Analisi in corso…' : 'Esegui analisi'}
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {selected.size} di {options.length} interventi candidati
          </span>
        </div>
      </section>

      {/* ---- Selezione candidati ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <div>
            <h2 className="tepo-card__title">Interventi candidati</h2>
            <p className="tepo-card__subtitle">
              Gli stessi candidati vengono valutati a ogni punto della griglia.
            </p>
          </div>
          <button
            className="tepo-button tepo-button--secondary tepo-button--sm"
            onClick={toggleAll}
          >
            {selected.size === options.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
          <table className="tepo-table tepo-table--compact">
            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>ID</th>
                <th>Nome</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
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
                </tr>
              ))}
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
          <strong>Errore analisi:</strong> {error}
        </div>
      )}

      {/* ---- Risultato ---- */}
      {result && (
        <>
          {/* KPI sintetiche */}
          <section>
            <h2 style={{
              margin: '0 0 var(--space-3)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Sintesi
            </h2>
            <div className="tepo-kpi-grid">
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Obiettivo</span>
                <span className="tepo-kpi__value" style={{ fontSize: 'var(--font-size-lg)' }}>
                  {OBJECTIVE_LABELS[result.objective] ?? result.objective}
                </span>
              </div>
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Punti analizzati</span>
                <span className="tepo-kpi__value">{result.points}</span>
              </div>
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Intervallo budget</span>
                <span className="tepo-kpi__value" style={{ fontSize: 'var(--font-size-lg)' }}>
                  {fmtEur(result.minBudgetCents)} – {fmtEur(result.maxBudgetCents)}
                </span>
              </div>
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Stabili (sempre)</span>
                <span className="tepo-kpi__value">{result.alwaysSelected.length}</span>
              </div>
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Oscillanti</span>
                <span className="tepo-kpi__value">{result.swing.length}</span>
              </div>
              <div className="tepo-kpi">
                <span className="tepo-kpi__label">Mai selezionati</span>
                <span className="tepo-kpi__value">{result.neverSelected.length}</span>
              </div>
            </div>
          </section>

          {/* Griglia */}
          <section className="tepo-card">
            <div className="tepo-card__header">
              <div>
                <h2 className="tepo-card__title">Risultati per punto</h2>
                <p className="tepo-card__subtitle">
                  Ogni riga è un'ottimizzazione indipendente sullo stesso set di candidati.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="tepo-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>Budget</th>
                    <th>Stato</th>
                    <th style={{ textAlign: 'right' }}>Investimento</th>
                    <th style={{ textAlign: 'right' }}>Residuo</th>
                    <th style={{ textAlign: 'right' }}>Obiettivo</th>
                    <th>Interventi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.grid.map((p) => (
                    <tr key={p.budgetCents}>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtEur(p.budgetCents)}
                      </td>
                      <td>
                        <span
                          className={
                            p.solverStatus === 'OPTIMAL'
                              ? 'tepo-badge tepo-badge--success'
                              : p.solverStatus === 'FEASIBLE'
                              ? 'tepo-badge tepo-badge--warning'
                              : 'tepo-badge'
                          }
                        >
                          {p.solverStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtEur(p.totalInvestmentCents)}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtEur(p.remainingBudgetCents)}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtNum(p.objectiveValue)}
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)'
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              display: 'inline-block',
                              height: 8,
                              width: `${Math.max(2, (p.numSelected / maxSelected) * 120)}px`,
                              background: 'var(--color-brand-accent)',
                              borderRadius: 'var(--radius-full)'
                            }}
                          />
                          <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>
                            {p.numSelected}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Stabilità */}
          <section className="tepo-card">
            <div className="tepo-card__header">
              <div>
                <h2 className="tepo-card__title">Stabilità delle selezioni</h2>
                <p className="tepo-card__subtitle">
                  Classificazione rispetto a tutti i punti della griglia.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'var(--space-4)'
              }}
            >
              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--letter-spacing-wide)',
                  color: 'var(--color-state-success-fg)',
                  margin: '0 0 var(--space-2)'
                }}>
                  Sempre selezionati ({result.alwaysSelected.length})
                </h3>
                {result.alwaysSelected.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                    Nessuno stabile in tutta la griglia.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {result.alwaysSelected.map((id) => (
                      <li key={id}>
                        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</span>
                        {' — '}{optionName(id)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--letter-spacing-wide)',
                  color: 'var(--color-state-warning-fg)',
                  margin: '0 0 var(--space-2)'
                }}>
                  Oscillanti ({result.swing.length})
                </h3>
                {result.swing.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                    Nessuna opzione cambia stato nella griglia.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {result.swing.map((id) => (
                      <li key={id}>
                        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</span>
                        {' — '}{optionName(id)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--letter-spacing-wide)',
                  color: 'var(--color-text-muted)',
                  margin: '0 0 var(--space-2)'
                }}>
                  Mai selezionati ({result.neverSelected.length})
                </h3>
                {result.neverSelected.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                    Nessuna opzione esclusa su tutta la griglia.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {result.neverSelected.map((id) => (
                      <li key={id}>
                        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</span>
                        {' — '}{optionName(id)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}