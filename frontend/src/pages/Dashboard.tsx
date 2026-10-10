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

  if (error) return <div className="card">Backend non raggiungibile: {error}</div>;

  return (
    <>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--tepo-muted)' }}>
        L'AI propone. L'utente confronta. Il Comune decide. Dataset DEMO — dati sintetici.
      </p>

      {!lastResult && (
        <div className="card">
          <h3>Crea uno scenario per iniziare</h3>
          <p>Configura budget, obiettivo e vincoli. Il solver calcola il portafoglio proposto.</p>
          <Link to="/scenario"><button>Vai allo Scenario Builder</button></Link>
        </div>
      )}

      {lastResult && (
        <>
          <h2>Ultimo risultato</h2>
          <div className="kpi-grid">
            <div className="kpi"><div className="label">Investimento</div><div className="value">€ {(lastResult.totalInvestmentCents / 100).toLocaleString('it-IT')}</div></div>
            <div className="kpi"><div className="label">Budget residuo</div><div className="value">€ {(lastResult.remainingBudgetCents / 100).toLocaleString('it-IT')}</div></div>
            <div className="kpi"><div className="label">Risparmio energetico</div><div className="value">{lastResult.totalEnergySavingScaled.toLocaleString('it-IT')}</div></div>
            <div className="kpi"><div className="label">Risparmio economico</div><div className="value">€ {(lastResult.totalEconomicSavingCents / 100).toLocaleString('it-IT')}</div></div>
            <div className="kpi"><div className="label">CO2 evitata</div><div className="value">{lastResult.totalCo2ReductionScaled.toLocaleString('it-IT')} kg</div></div>
            <div className="kpi"><div className="label">Interventi</div><div className="value">{lastResult.selectedOptionsId.length}</div></div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <Link to="/result"><button>Apri risultato</button></Link>{' '}
            <Link to="/compare"><button>Confronta scenari</button></Link>
          </div>
        </>
      )}

      <h2>Catalogo</h2>
      <div className="kpi-grid">
        <div className="kpi"><div className="label">Edifici</div><div className="value">{buildings.length}</div></div>
        <div className="kpi"><div className="label">Interventi candidati</div><div className="value">{options.length}</div></div>
        <div className="kpi"><div className="label">Investimento catalogo</div><div className="value">€ {(options.reduce((s, o) => s + o.investmentCostCents, 0) / 100).toLocaleString('it-IT')}</div></div>
      </div>
    </>
  );
}