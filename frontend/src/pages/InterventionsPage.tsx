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

  return (
    <>
      <h1>Interventi candidati</h1>
      <p style={{ color: 'var(--tepo-muted)' }}>
        {result
          ? 'Filtro applicato sull\'ultimo scenario eseguito.'
          : 'Nessun scenario ancora eseguito: tutti gli interventi risultano "non valutati".'}
      </p>

      <div className="card">
        <h3>Filtri</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 12
        }}>
          <label>
            <span>Ricerca</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, nome, edificio, tipo" />
          </label>

          <label>
            <span>Edificio</span>
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
              <option value="">Tutti</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Tipo intervento</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tutti</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Costo minimo (EUR)</span>
            <input type="number" min={0} value={costMin}
                   onChange={(e) => setCostMin(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>

          <label>
            <span>Costo massimo (EUR)</span>
            <input type="number" min={0} value={costMax}
                   onChange={(e) => setCostMax(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>

          <label>
            <span>Stato nello scenario</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="ALL">Tutti</option>
              <option value="SELECTED">Selezionati</option>
              <option value="EXCLUDED">Esclusi</option>
              <option value="NOT_EVALUATED">Non valutati</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={resetFilters}>Azzera filtri</button>
          <span style={{ color: 'var(--tepo-muted)', fontSize: 14 }}>
            {filtered.length} di {options.length} interventi
          </span>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Edificio</th><th>Intervento</th><th>Tipo</th>
              <th>Costo</th><th>Risparmio energia</th>
              <th>Risparmio economico</th><th>CO2</th><th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const st = statusOf(o.id);
              const stLabel = st === 'SELECTED' ? 'Selezionato'
                : st === 'EXCLUDED' ? 'Escluso'
                : '—';
              const stColor = st === 'SELECTED' ? '#2f7d5f'
                : st === 'EXCLUDED' ? '#9aa5b1'
                : 'var(--tepo-muted)';
              return (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{buildingName(o.buildingId)}</td>
                  <td>{o.name}</td>
                  <td>{typeName(o.interventionTypeId)}</td>
                  <td>€ {(o.investmentCostCents / 100).toLocaleString('it-IT')}</td>
                  <td>{o.annualEnergySavingScaled.toLocaleString('it-IT')}</td>
                  <td>€ {(o.annualEconomicSavingCents / 100).toLocaleString('it-IT')}</td>
                  <td>{o.annualCo2ReductionScaled.toLocaleString('it-IT')} kg</td>
                  <td style={{ color: stColor, fontWeight: 600 }}>{stLabel}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--tepo-muted)', padding: 24 }}>
                Nessun intervento corrisponde ai filtri.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}