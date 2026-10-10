import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
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

  const optionsFor = (buildingId: string) => options.filter((o) => o.buildingId === buildingId);

  // Per ogni edificio: ha interventi selezionati? esclusi?
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
    if (!result) return '#2e5d94'; // blu neutro
    if (buildingHasSelected(buildingId) && !buildingHasExcluded(buildingId)) return '#2f7d5f'; // verde
    if (buildingHasSelected(buildingId) && buildingHasExcluded(buildingId)) return '#f5a623'; // arancio misto
    if (buildingHasExcluded(buildingId)) return '#9aa5b1'; // grigio
    return '#2e5d94';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, height: 'calc(100vh - 140px)' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <MapContainer center={[46.0679, 11.1211]} zoom={14} style={{ height: '100%', width: '100%' }}>
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

        {/* Legenda */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16, background: 'white',
          padding: 10, borderRadius: 6, border: '1px solid var(--tepo-border)', fontSize: 12, zIndex: 1000
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Stato scenario</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#2f7d5f', marginRight: 6, borderRadius: 6 }}></span>Solo selezionati</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#f5a623', marginRight: 6, borderRadius: 6 }}></span>Selezionati + esclusi</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#9aa5b1', marginRight: 6, borderRadius: 6 }}></span>Solo esclusi</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#2e5d94', marginRight: 6, borderRadius: 6 }}></span>Non valutati</div>
        </div>
      </div>

      <aside className="card">
        {selected ? (
          <>
            <h3>{buildings.find((b) => b.id === selected)?.name}</h3>
            <p>{buildings.find((b) => b.id === selected)?.address}</p>
            <h4>Interventi disponibili</h4>
            <table>
              <thead><tr><th>Intervento</th><th>Costo</th><th>Stato</th></tr></thead>
              <tbody>
                {optionsFor(selected).map((o) => {
                  let stato = '—';
                  if (result) {
                    if (result.selectedOptionsId.includes(o.id)) stato = 'Selezionato';
                    else if (result.excludedOptionsId.includes(o.id)) stato = 'Escluso';
                  }
                  return (
                    <tr key={o.id}>
                      <td>{o.name}</td>
                      <td>€ {(o.investmentCostCents / 100).toLocaleString('it-IT')}</td>
                      <td>{stato}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <p>Seleziona un edificio sulla mappa.</p>
        )}
      </aside>
    </div>
  );
}