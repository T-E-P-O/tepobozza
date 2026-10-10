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

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <>
      <h1>Edifici</h1>

      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 12
        }}>
          <label>
            <span>Ricerca</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome o indirizzo" />
          </label>
          <label>
            <span>Tipo edificio</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tutti</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { setQuery(''); setTypeFilter(''); }}>Azzera filtri</button>
          <span style={{ color: 'var(--tepo-muted)', fontSize: 14 }}>
            {filtered.length} di {buildings.length} edifici
          </span>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('id')} style={{ cursor: 'pointer' }}>ID{arrow('id')}</th>
              <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>Nome{arrow('name')}</th>
              <th>Indirizzo</th>
              <th onClick={() => toggleSort('buildingType')} style={{ cursor: 'pointer' }}>Tipo{arrow('buildingType')}</th>
              <th onClick={() => toggleSort('surfaceM2')} style={{ cursor: 'pointer' }}>Superficie{arrow('surfaceM2')}</th>
              <th>Provenienza</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>{b.buildingType}</td>
                <td>{b.surfaceM2} m²</td>
                <td>{b.provenance}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tepo-muted)', padding: 24 }}>
                Nessun edificio corrisponde ai filtri.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}