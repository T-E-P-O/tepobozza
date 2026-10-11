import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInterventions, fetchBuildings } from '../services/api';
import { loadLastResult, saveAsScenario } from '../services/scenarioStore';
import type { InterventionOption, Building, OptimizationResult } from '../types';

type OptimizePayload = {
  budgetCents: number;
  objective: string;
  candidateOptionIds: string[];
  incompatibilities: string[][];
  prerequisites: string[][];
  maxNumber: number | null;
  maxNumberOptionIds: string[];
};

export default function ResultPage() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [payload, setPayload] = useState<OptimizePayload | null>(null);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const last = loadLastResult();
    if (last) {
      setResult(last.result);
      setPayload(last.payload as OptimizePayload);
    }
    fetchInterventions().then(setOptions);
    fetchBuildings().then(setBuildings);
  }, []);

  if (!result) {
    return (
      <div className="tepo-card">
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Nessun risultato disponibile. Esegui uno scenario.
        </p>
        <div className="tepo-card__footer">
          <button
            className="tepo-button tepo-button--primary"
            onClick={() => navigate('/scenario')}
          >
            Vai allo Scenario Builder
          </button>
        </div>
      </div>
    );
  }

  const optionById = (id: string) => options.find((o) => o.id === id);
  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const explanationFor = (id: string) =>
    result.explanations.find((e) => e.optionId === id);

  const saveSlot = (slot: 'A' | 'B') => {
    if (!payload) return;
    saveAsScenario(slot, slot === 'A' ? 'Scenario A' : 'Scenario B', payload, result);
    alert(`Salvato come Scenario ${slot}`);
  };

  const isOptimal = result.solverStatus === 'OPTIMAL';

  return (
    <div className="tepo-stack tepo-stack--loose">
      <header>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-semibold)'
            }}
          >
            Portafoglio proposto
          </h1>
          <span className={isOptimal ? 'tepo-badge tepo-badge--success' : 'tepo-badge tepo-badge--warning'}>
            {result.solverStatus}
            {result.optimalityProven ? ' — ottimalità provata' : ''}
          </span>
        </div>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Proposta del solver deterministico. La decisione resta in capo all'operatore.
        </p>
      </header>

      {/* ---- Azioni ---- */}
      <div className="tepo-cluster">
        <button className="tepo-button tepo-button--secondary tepo-button--sm" onClick={() => saveSlot('A')}>
          Salva come Scenario A
        </button>
        <button className="tepo-button tepo-button--secondary tepo-button--sm" onClick={() => saveSlot('B')}>
          Salva come Scenario B
        </button>
        <button className="tepo-button tepo-button--ghost tepo-button--sm" onClick={() => navigate('/scenario?from=A')}>
          Duplica A come What-If
        </button>
        <button className="tepo-button tepo-button--ghost tepo-button--sm" onClick={() => navigate('/scenario?from=B')}>
          Duplica B come What-If
        </button>
        <button className="tepo-button tepo-button--primary tepo-button--sm" onClick={() => navigate('/compare')}>
          Confronta A vs B
        </button>
      </div>

      {/* ---- KPI ---- */}
      <section>
        <div className="tepo-kpi-grid">
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Investimento totale</span>
            <span className="tepo-kpi__value">
              € {(result.totalInvestmentCents / 100).toLocaleString('it-IT')}
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Budget residuo</span>
            <span className="tepo-kpi__value">
              € {(result.remainingBudgetCents / 100).toLocaleString('it-IT')}
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Risparmio energetico</span>
            <span className="tepo-kpi__value">
              {result.totalEnergySavingScaled.toLocaleString('it-IT')}
              <span className="tepo-kpi__unit">kWh/anno</span>
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Risparmio economico</span>
            <span className="tepo-kpi__value">
              € {(result.totalEconomicSavingCents / 100).toLocaleString('it-IT')}
              <span className="tepo-kpi__unit">/anno</span>
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">CO2 evitata</span>
            <span className="tepo-kpi__value">
              {result.totalCo2ReductionScaled.toLocaleString('it-IT')}
              <span className="tepo-kpi__unit">kg/anno</span>
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Interventi selezionati</span>
            <span className="tepo-kpi__value">{result.selectedOptionsId.length}</span>
          </div>
        </div>
      </section>

      {/* ---- Tabella selezionati ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <div>
            <h2 className="tepo-card__title">Interventi selezionati</h2>
            <p className="tepo-card__subtitle">
              Ogni riga riporta la motivazione generata dal motore di spiegazione.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tepo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Edificio</th>
                <th>Intervento</th>
                <th style={{ textAlign: 'right' }}>Investimento</th>
                <th style={{ textAlign: 'right' }}>Risparmio energia</th>
                <th>Motivazione</th>
              </tr>
            </thead>
            <tbody>
              {result.selectedOptionsId.map((id) => {
                const o = optionById(id);
                const ex = explanationFor(id);
                return (
                  <tr key={id}>
                    <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</td>
                    <td>{o ? buildingName(o.buildingId) : '—'}</td>
                    <td>{o?.name ?? '—'}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      € {o ? (o.investmentCostCents / 100).toLocaleString('it-IT') : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {o?.annualEnergySavingScaled.toLocaleString('it-IT') ?? '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {ex?.message}
                    </td>
                  </tr>
                );
              })}
              {result.selectedOptionsId.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-6)' }}>
                    Nessun intervento selezionato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Perché questa soluzione ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Perché questa soluzione?</h2>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
          Obiettivo: massimizzazione del beneficio scelto; budget rispettato;
          numero candidati {payload?.candidateOptionIds.length ?? '—'};
          selezionati {result.selectedOptionsId.length}.
        </p>

        <h3
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--letter-spacing-wide)',
            color: 'var(--color-text-muted)',
            margin: '0 0 var(--space-3)'
          }}
        >
          Perché alcuni interventi non sono stati selezionati?
        </h3>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          {result.excludedOptionsId.slice(0, 15).map((id) => {
            const ex = explanationFor(id);
            return (
              <li
                key={id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr',
                  gap: 'var(--space-3)',
                  alignItems: 'baseline',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--color-divider)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  {id}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {ex?.message ?? 'Motivazione non disponibile'}
                </span>
              </li>
            );
          })}
        </ul>

        {result.excludedOptionsId.length > 15 && (
          <p
            style={{
              marginTop: 'var(--space-3)',
              marginBottom: 0,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)'
            }}
          >
            … e altri {result.excludedOptionsId.length - 15} interventi esclusi.
          </p>
        )}
      </section>
    </div>
  );
}