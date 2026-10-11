import { useEffect, useMemo, useState } from 'react';
import { fetchInterventions, fetchBuildings } from '../services/api';
import { loadLastResult } from '../services/scenarioStore';
import type { InterventionOption, Building, OptimizationResult } from '../types';

type StatusFilter = 'ALL' | 'SELECTED' | 'EXCLUDED' | 'NOT_EVALUATED';

export default function InterventionsPage() {
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const [query, setQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [costMin, setCostMin] = useState<number | ''>('');
  const [costMax, setCostMax] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    fetchInterventions().then(setOptions);
    fetchBuildings().then(setBuildings);
    fetch('/api/intervention-types')
      .then((r) => r.json())
      .then(setTypes)
      .catch(() => setTypes([]));
    const last = loadLastResult();
    if (last) setResult(last.result);
  }, []);

  const buildingName = (id: string) =>
    buildings.find((b) => b.id === id)?.name ?? id;

  const typeName = (id: string) =>
    types.find((t) => t.id === id)?.name ?? id;

  const statusOf = (id: string): StatusFilter => {
    if (!result) return 'NOT_EVALUATED';
    if (result.selectedOptionsId.includes(id)) return 'SELECTED';
    if (result.excludedOptionsId.includes(id)) return 'EXCLUDED';
    return 'NOT_EVALUATED';
  };

  const filtered = useMemo(() => {
    return options.filter((o) => {
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${o.id} ${o.name} ${buildingName(o.buildingId)} ${typeName(o.interventionTypeId)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (buildingFilter && o.buildingId !== buildingFilter) return false;
      if (typeFilter && o.interventionTypeId !== typeFilter) return false;
      if (costMin !== '' && o.investmentCostCents < costMin * 100) return false;
      if (costMax !== '' && o.investmentCostCents > costMax * 100) return false;
      if (statusFilter !== 'ALL' && statusOf(o.id) !== statusFilter) return false;
      return true;
    });
  }, [options, query, buildingFilter, typeFilter, costMin, costMax, statusFilter, result, buildings, types]);

  const resetFilters = () => {
    setQuery('');
    setBuildingFilter('');
    setTypeFilter('');
    setCostMin('');
    setCostMax('');
    setStatusFilter('ALL');
  };

  const statusBadge = (id: string) => {
    const st = statusOf(id);
    if (st === 'SELECTED') {
      return <span className="tepo-badge tepo-badge--success">Selezionato</span>;
    }
    if (st === 'EXCLUDED') {
      return <span className="tepo-badge tepo-badge--warning">Escluso</span>;
    }
    return <span className="tepo-badge">—</span>;
  };

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
          Interventi candidati
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          {result
            ? 'Filtro applicato sull\'ultimo scenario eseguito.'
            : 'Nessun scenario eseguito: tutti gli interventi risultano "non valutati".'}
        </p>
      </header>

      {/* ---- Filtri ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Filtri</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)'
          }}
        >
          <label className="tepo-field">
            <span className="tepo-field__label">Ricerca</span>
            <input
              className="tepo-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, nome, edificio, tipo"
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Edificio</span>
            <select
              className="tepo-select"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
            >
              <option value="">Tutti</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Tipo intervento</span>
            <select
              className="tepo-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tutti</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Costo minimo (EUR)</span>
            <input
              className="tepo-input"
              type="number"
              min={0}
              value={costMin}
              onChange={(e) => setCostMin(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Costo massimo (EUR)</span>
            <input
              className="tepo-input"
              type="number"
              min={0}
              value={costMax}
              onChange={(e) => setCostMax(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Stato nello scenario</span>
            <select
              className="tepo-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">Tutti</option>
              <option value="SELECTED">Selezionati</option>
              <option value="EXCLUDED">Esclusi</option>
              <option value="NOT_EVALUATED">Non valutati</option>
            </select>
          </label>
        </div>

        <div className="tepo-card__footer" style={{ marginTop: 'var(--space-4)' }}>
          <button className="tepo-button tepo-button--secondary tepo-button--sm" onClick={resetFilters}>
            Azzera filtri
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {filtered.length} di {options.length} interventi
          </span>
        </div>
      </section>

      {/* ---- Tabella ---- */}
      <section className="tepo-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="tepo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Edificio</th>
                <th>Intervento</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Risparmio energia</th>
                <th style={{ textAlign: 'right' }}>Risparmio economico</th>
                <th style={{ textAlign: 'right' }}>CO2</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                    {o.id}
                  </td>
                  <td>{buildingName(o.buildingId)}</td>
                  <td>{o.name}</td>
                  <td>{typeName(o.interventionTypeId)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    € {(o.investmentCostCents / 100).toLocaleString('it-IT')}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {o.annualEnergySavingScaled.toLocaleString('it-IT')}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    € {(o.annualEconomicSavingCents / 100).toLocaleString('it-IT')}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {o.annualCo2ReductionScaled.toLocaleString('it-IT')} kg
                  </td>
                  <td>{statusBadge(o.id)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      padding: 'var(--space-6)'
                    }}
                  >
                    Nessun intervento corrisponde ai filtri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}