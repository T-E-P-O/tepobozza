import { useState } from 'react';

export default function ImportPage() {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const doValidate = async () => {
    setError(null); setResult(null);
    const r = await fetch('/api/imports/buildings/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!r.ok) { setError('Errore validazione'); return; }
    setPreview(await r.json());
  };

  const doCommit = async () => {
    setError(null);
    const r = await fetch('/api/imports/buildings/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!r.ok) { setError('Errore commit'); return; }
    setResult(await r.json());
  };

  return (
    <>
      <h1>Import CSV edifici</h1>
      <p style={{ color: 'var(--tepo-muted)' }}>
        Header atteso: id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
      </p>
      <div className="card">
        <label>
          <span>Contenuto CSV</span>
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </label>
        <button onClick={doValidate} disabled={!content.trim()}>Valida</button>{' '}
        <button onClick={doCommit} disabled={!preview || preview.valid === 0}>
          Importa record validi
        </button>
      </div>

      {error && <div className="card" style={{ color: 'crimson' }}>{error}</div>}

      {preview && (
        <div className="card">
          <h3>Preview</h3>
          <p>Validi: <strong>{preview.valid}</strong> — Invalidi: <strong>{preview.invalid}</strong></p>
          <table>
            <thead><tr><th>Riga</th><th>ID</th><th>Errori</th></tr></thead>
            <tbody>
              {preview.rows.map((r: any) => (
                <tr key={r.rowNumber}>
                  <td>{r.rowNumber}</td>
                  <td>{r.id}</td>
                  <td>{r.errors.join('; ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div className="card">
          <h3>Risultato import</h3>
          <p>Inseriti: {result.inserted} — Saltati: {result.skipped}</p>
        </div>
      )}
    </>
  );
}