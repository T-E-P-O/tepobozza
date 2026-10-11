import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchBuildings, fetchInterventions } from '../services/api';
import { loadLastResult } from '../services/scenarioStore';
import type { Building, InterventionOption, OptimizationResult } from '../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [options, setOptions] = useState<InterventionOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    fetchBuildings().then(setBuildings);
    fetchInterventions().then(setOptions);
    const last = loadLastResult();
    if (last) setResult(last.result);
  }, []);

  const optionsFor = (buildingId: string) =>
    options.filter((o) => o.buildingId === buildingId);

  const buildingHasSelected = (buildingId: string) => {
    if (!result) return false;
    const ids = optionsFor(buildingId).map((o) => o.id);
    return ids.some((id) => result.selectedOptionsId.includes(id));
  };

  const buildingHasExcluded = (buildingId: string) => {
    if (!result) return false;
    const ids = optionsFor(buildingId).map((o) => o.id);
    return ids.some((id) => result.excludedOptionsId.includes(id));
  };

  const colorFor = (buildingId: string): string => {
    if (!result) return '#2e5d94';
    if (buildingHasSelected(buildingId) && !buildingHasExcluded(buildingId)) return '#2f7d5f';
    if (buildingHasSelected(buildingId) && buildingHasExcluded(buildingId)) return '#f5a623';
    if (buildingHasExcluded(buildingId)) return '#9aa5b1';
    return '#2e5d94';
  };

  const selectedBuilding = selected ? buildings.find((b) => b.id === selected) : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: 'var(--space-4)',
        height: 'calc(100vh - 140px)'
      }}
    >
      {/* ---- Mappa ---- */}
      <div
        className="tepo-card"
        style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        <MapContainer
          center={[46.0679, 11.1211]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {buildings.map((b) => (
            <CircleMarker
              key={b.id}
              center={[b.latitude, b.longitude]}
              radius={10}
              pathOptions={{ color: colorFor(b.id), fillColor: colorFor(b.id), fillOpacity: 0.85 }}
              eventHandlers={{ click: () => setSelected(b.id) }}
            >
              <Popup>
                <strong>{b.name}</strong><br />
                {b.address}<br />
                <em>DEMO — dati sintetici</em><br />
                {result && buildingHasSelected(b.id) && <>Con interventi selezionati<br /></>}
                {result && buildingHasExcluded(b.id) && <>Con interventi esclusi<br /></>}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* ---- Legenda ---- */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-4)',
            left: 'var(--space-4)',
            background: 'var(--color-surface)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 1000,
            lineHeight: 'var(--line-height-relaxed)'
          }}
        >
          <div
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)'
            }}
          >
            Stato scenario
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 10, height: 10, background: '#2f7d5f', borderRadius: 5, display: 'inline-block' }} />
            Solo selezionati
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 10, height: 10, background: '#f5a623', borderRadius: 5, display: 'inline-block' }} />
            Selezionati + esclusi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 10, height: 10, background: '#9aa5b1', borderRadius: 5, display: 'inline-block' }} />
            Solo esclusi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 10, height: 10, background: '#2e5d94', borderRadius: 5, display: 'inline-block' }} />
            Non valutati
          </div>
        </div>
      </div>

      {/* ---- Sidebar ---- */}
      <aside className="tepo-card" style={{ overflowY: 'auto' }}>
        {selectedBuilding ? (
          <>
            <header style={{ marginBottom: 'var(--space-3)' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}
              >
                {selectedBuilding.name}
              </h2>
              <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {selectedBuilding.address}
              </p>
            </header>

            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--letter-spacing-wide)',
                color: 'var(--color-text-muted)',
                margin: 'var(--space-3) 0 var(--space-2)'
              }}
            >
              Interventi disponibili
            </h3>

            <table className="tepo-table tepo-table--compact">
              <thead>
                <tr>
                  <th>Intervento</th>
                  <th style={{ textAlign: 'right' }}>Costo</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {optionsFor(selectedBuilding.id).map((o) => {
                  let statoLabel = '—';
                  let statoClass = 'tepo-badge';
                  if (result) {
                    if (result.selectedOptionsId.includes(o.id)) {
                      statoLabel = 'Selezionato';
                      statoClass = 'tepo-badge tepo-badge--success';
                    } else if (result.excludedOptionsId.includes(o.id)) {
                      statoLabel = 'Escluso';
                      statoClass = 'tepo-badge tepo-badge--warning';
                    }
                  }
                  return (
                    <tr key={o.id}>
                      <td>{o.name}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        € {(o.investmentCostCents / 100).toLocaleString('it-IT')}
                      </td>
                      <td><span className={statoClass}>{statoLabel}</span></td>
                    </tr>
                  );
                })}
                {optionsFor(selectedBuilding.id).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Nessun intervento disponibile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Seleziona un edificio sulla mappa.
          </p>
        )}
      </aside>
    </div>
  );
}