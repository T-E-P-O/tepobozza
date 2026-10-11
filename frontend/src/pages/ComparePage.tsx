import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadScenario, type StoredScenario } from '../services/scenarioStore';
import { fetchInterventions, fetchBuildings } from '../services/api';
import type { InterventionOption, Building } from '../types';

export default function ComparePage() {
  const [a, setA] = useState<StoredScenario | null>(null);
  const [b, setB] = useState<StoredScenario | null>(null);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setA(loadScenario('A'));
    setB(loadScenario('B'));
    fetchInterventions().then(setOptions);
    fetchBuildings().then(setBuildings);
  }, []);

  if (!a || !b) {
    return (
      <div className="tepo-card">
        <h1 className="tepo-card__title">Confronto scenari</h1>
        <p className="tepo-card__subtitle">
          Servono due scenari salvati. Esegui due ottimizzazioni e salva ciascuna come A e B.
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

  const optionName = (id: string) => options.find((o) => o.id === id)?.name ?? id;
  const buildingOf = (id: string) => {
    const o = options.find((x) => x.id === id);
    return o ? (buildings.find((b) => b.id === o.buildingId)?.name ?? o.buildingId) : '—';
  };

  const added = b.result.selectedOptionsId.filter(
    (id) => !a.result.selectedOptionsId.includes(id)
  );
  const removed = a.result.selectedOptionsId.filter(
    (id) => !b.result.selectedOptionsId.includes(id)
  );

  const fEur = (c: number) => `€ ${(c / 100).toLocaleString('it-IT')}`;
  const fNum = (n: number) => n.toLocaleString('it-IT');

  // delta positivo = B > A
  const delta = (va: number, vb: number) => vb - va;
  const deltaClass = (d: number) => {
    if (d > 0) return 'tepo-kpi__delta tepo-kpi__delta--up';
    if (d < 0) return 'tepo-kpi__delta tepo-kpi__delta--down';
    return 'tepo-kpi__delta';
  };
  const deltaLabel = (d: number, unit: string = '') => {
    if (d === 0) return 'invariato';
    const sign = d > 0 ? '+' : '';
    return `${sign}${fNum(d)}${unit}`;
  };

  type Row = { label: string; va: string; vb: string };
  const rows: Row[] = [
    { label: 'Budget', va: fEur(a.payload.budgetCents), vb: fEur(b.payload.budgetCents) },
    { label: 'Obiettivo', va: a.payload.objective, vb: b.payload.objective },
    { label: 'Investimento', va: fEur(a.result.totalInvestmentCents), vb: fEur(b.result.totalInvestmentCents) },
    { label: 'Budget residuo', va: fEur(a.result.remainingBudgetCents), vb: fEur(b.result.remainingBudgetCents) },
    { label: 'Risparmio energetico', va: fNum(a.result.totalEnergySavingScaled), vb: fNum(b.result.totalEnergySavingScaled) },
    { label: 'Risparmio economico', va: fEur(a.result.totalEconomicSavingCents), vb: fEur(b.result.totalEconomicSavingCents) },
    { label: 'CO2 evitata (kg)', va: fNum(a.result.totalCo2ReductionScaled), vb: fNum(b.result.totalCo2ReductionScaled) },
    { label: 'Interventi selezionati', va: String(a.result.selectedOptionsId.length), vb: String(b.result.selectedOptionsId.length) },
    { label: 'Stato solver', va: a.result.solverStatus, vb: b.result.solverStatus }
  ];

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
          Confronto scenari
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Confronto fra lo Scenario A e lo Scenario B salvati in questa sessione.
        </p>
      </header>

      {/* ---- Delta cards ---- */}
      <section>
        <div className="tepo-kpi-grid">
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Δ Investimento</span>
            <span className="tepo-kpi__value">
              € {fNum(delta(a.result.totalInvestmentCents, b.result.totalInvestmentCents) / 100)}
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Δ Risparmio energetico</span>
            <span className="tepo-kpi__value">
              {deltaLabel(delta(a.result.totalEnergySavingScaled, b.result.totalEnergySavingScaled))}
              <span className="tepo-kpi__unit">kWh/anno</span>
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Δ Risparmio economico</span>
            <span className="tepo-kpi__value">
              € {fNum(delta(a.result.totalEconomicSavingCents, b.result.totalEconomicSavingCents) / 100)}
              <span className="tepo-kpi__unit">/anno</span>
            </span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Δ Interventi</span>
            <span className="tepo-kpi__value">
              {deltaLabel(delta(a.result.selectedOptionsId.length, b.result.selectedOptionsId.length))}
            </span>
          </div>
        </div>
      </section>

      {/* ---- Tabella completa ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Metriche a confronto</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tepo-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Metrica</th>
                <th style={{ textAlign: 'right' }}>Scenario A</th>
                <th style={{ textAlign: 'right' }}>Scenario B</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{r.label}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.va}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.vb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Interventi aggiunti ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <div>
            <h2 className="tepo-card__title">Interventi aggiunti in B</h2>
            <p className="tepo-card__subtitle">
              {added.length === 0
                ? 'Nessun intervento aggiunto.'
                : `${added.length} interventi non presenti nello Scenario A.`}
            </p>
          </div>
          {added.length > 0 && (
            <span className="tepo-badge tepo-badge--success">+{added.length}</span>
          )}
        </div>

        {added.length > 0 && (
          <table className="tepo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Edificio</th>
                <th>Intervento</th>
              </tr>
            </thead>
            <tbody>
              {added.map((id) => (
                <tr key={id}>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</td>
                  <td>{buildingOf(id)}</td>
                  <td>{optionName(id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ---- Interventi rimossi ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <div>
            <h2 className="tepo-card__title">Interventi rimossi in B</h2>
            <p className="tepo-card__subtitle">
              {removed.length === 0
                ? 'Nessun intervento rimosso.'
                : `${removed.length} interventi selezionati in A ma non in B.`}
            </p>
          </div>
          {removed.length > 0 && (
            <span className="tepo-badge tepo-badge--warning">−{removed.length}</span>
          )}
        </div>

        {removed.length > 0 && (
          <table className="tepo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Edificio</th>
                <th>Intervento</th>
              </tr>
            </thead>
            <tbody>
              {removed.map((id) => (
                <tr key={id}>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>{id}</td>
                  <td>{buildingOf(id)}</td>
                  <td>{optionName(id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}