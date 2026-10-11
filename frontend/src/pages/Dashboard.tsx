import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBuildings, fetchInterventions } from '../services/api';
import { loadLastResult } from '../services/scenarioStore';
import type { Building, InterventionOption, OptimizationResult } from '../types';

export default function Dashboard() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchBuildings(), fetchInterventions()])
      .then(([b, o]) => { setBuildings(b); setOptions(o); })
      .catch((e) => setError(e.message));
    const last = loadLastResult();
    if (last) setLastResult(last.result);
  }, []);

  if (error) {
    return (
      <div className="tepo-card">
        <p style={{ margin: 0, color: 'var(--color-state-danger-fg)' }}>
          Backend non raggiungibile: {error}
        </p>
      </div>
    );
  }

  const totalInvestment = options.reduce((s, o) => s + o.investmentCostCents, 0) / 100;

  return (
    <div className="tepo-stack tepo-stack--loose">
      <header>
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)' }}>
          Dashboard
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          L'AI propone. L'utente confronta. Il Comune decide. Dataset DEMO — dati sintetici.
        </p>
      </header>

      {!lastResult && (
        <section className="tepo-card">
          <h2 className="tepo-card__title">Crea uno scenario per iniziare</h2>
          <p className="tepo-card__subtitle">
            Configura budget, obiettivo e vincoli. Il solver calcola il portafoglio proposto.
          </p>
          <div className="tepo-card__footer">
            <Link to="/scenario" className="tepo-button tepo-button--primary">
              Vai allo Scenario Builder
            </Link>
          </div>
        </section>
      )}

      {lastResult && (
        <section>
          <h2 style={{
            margin: '0 0 var(--space-3)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)'
          }}>
            Ultimo risultato
          </h2>

          <div className="tepo-kpi-grid">
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">Investimento</span>
              <span className="tepo-kpi__value">
                € {(lastResult.totalInvestmentCents / 100).toLocaleString('it-IT')}
              </span>
            </div>
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">Budget residuo</span>
              <span className="tepo-kpi__value">
                € {(lastResult.remainingBudgetCents / 100).toLocaleString('it-IT')}
              </span>
            </div>
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">Risparmio energetico</span>
              <span className="tepo-kpi__value">
                {lastResult.totalEnergySavingScaled.toLocaleString('it-IT')}
                <span className="tepo-kpi__unit">kWh/anno</span>
              </span>
            </div>
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">Risparmio economico</span>
              <span className="tepo-kpi__value">
                € {(lastResult.totalEconomicSavingCents / 100).toLocaleString('it-IT')}
                <span className="tepo-kpi__unit">/anno</span>
              </span>
            </div>
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">CO2 evitata</span>
              <span className="tepo-kpi__value">
                {lastResult.totalCo2ReductionScaled.toLocaleString('it-IT')}
                <span className="tepo-kpi__unit">kg/anno</span>
              </span>
            </div>
            <div className="tepo-kpi">
              <span className="tepo-kpi__label">Interventi</span>
              <span className="tepo-kpi__value">
                {lastResult.selectedOptionsId.length}
              </span>
            </div>
          </div>

          <div className="tepo-cluster" style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/result" className="tepo-button tepo-button--primary">
              Apri risultato
            </Link>
            <Link to="/compare" className="tepo-button tepo-button--secondary">
              Confronta scenari
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 style={{
          margin: '0 0 var(--space-3)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)'
        }}>
          Catalogo
        </h2>

        <div className="tepo-kpi-grid">
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Edifici</span>
            <span className="tepo-kpi__value">{buildings.length}</span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Interventi candidati</span>
            <span className="tepo-kpi__value">{options.length}</span>
          </div>
          <div className="tepo-kpi">
            <span className="tepo-kpi__label">Investimento catalogo</span>
            <span className="tepo-kpi__value">
              € {totalInvestment.toLocaleString('it-IT')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}