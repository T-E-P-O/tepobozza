import { useEffect, useMemo, useState } from 'react';
import { fetchBuildings } from '../services/api';
import type { Building } from '../types';

type SortKey = 'id' | 'name' | 'buildingType' | 'surfaceM2';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { fetchBuildings().then(setBuildings); }, []);

  const types = useMemo(
    () => Array.from(new Set(buildings.map((b) => b.buildingType).filter(Boolean))).sort(),
    [buildings]
  );

  const filtered = useMemo(() => {
    const filteredList = buildings.filter((b) => {
      if (typeFilter && b.buildingType !== typeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${b.id} ${b.name} ${b.address ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filteredList].sort((a, b) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb));
    });

    return sortAsc ? sorted : sorted.reverse();
  }, [buildings, query, typeFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const arrow = (key: SortKey) => (sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '');

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
          Edifici
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Catalogo degli edifici demo. Tutti i dati sono sintetici.
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)'
          }}
        >
          <label className="tepo-field">
            <span className="tepo-field__label">Ricerca</span>
            <input
              className="tepo-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome o indirizzo"
            />
          </label>

          <label className="tepo-field">
            <span className="tepo-field__label">Tipo edificio</span>
            <select
              className="tepo-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tutti</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="tepo-card__footer" style={{ marginTop: 'var(--space-4)' }}>
          <button
            className="tepo-button tepo-button--secondary tepo-button--sm"
            onClick={() => { setQuery(''); setTypeFilter(''); }}
          >
            Azzera filtri
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {filtered.length} di {buildings.length} edifici
          </span>
        </div>
      </section>

      {/* ---- Tabella ---- */}
      <section className="tepo-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="tepo-table">
            <thead>
              <tr>
                <th
                  onClick={() => toggleSort('id')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  ID{arrow('id')}
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome{arrow('name')}
                </th>
                <th>Indirizzo</th>
                <th
                  onClick={() => toggleSort('buildingType')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Tipo{arrow('buildingType')}
                </th>
                <th
                  onClick={() => toggleSort('surfaceM2')}
                  style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                >
                  Superficie{arrow('surfaceM2')}
                </th>
                <th>Provenienza</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                    {b.id}
                  </td>
                  <td>{b.name}</td>
                  <td>{b.address}</td>
                  <td>{b.buildingType}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {b.surfaceM2} m²
                  </td>
                  <td>
                    <span className="tepo-badge">{b.provenance}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      padding: 'var(--space-6)'
                    }}
                  >
                    Nessun edificio corrisponde ai filtri.
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