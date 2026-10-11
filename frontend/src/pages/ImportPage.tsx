import { useState } from 'react';

export default function ImportPage() {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingValidate, setLoadingValidate] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);

  const doValidate = async () => {
    setError(null);
    setResult(null);
    setLoadingValidate(true);
    try {
      const r = await fetch('/api/imports/buildings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!r.ok) {
        const text = await r.text();
        setError(`Validazione fallita: ${text}`);
        return;
      }
      setPreview(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingValidate(false);
    }
  };

  const doCommit = async () => {
    setError(null);
    setLoadingCommit(true);
    try {
      const r = await fetch('/api/imports/buildings/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!r.ok) {
        const text = await r.text();
        setError(`Import fallito: ${text}`);
        return;
      }
      setResult(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCommit(false);
    }
  };

  const loadExample = () => {
    setContent(
      'id,name,address,municipality,latitude,longitude,buildingType,surfaceM2\n' +
      'BLD-101,Scuola nuova 1,Via Roma 5,Trento,46.0683,11.1206,Scuola,2200\n' +
      'BLD-102,Ufficio nuovo 2,Piazza Duomo 2,Trento,46.0676,11.1214,Ufficio,1600\n'
    );
    setPreview(null);
    setResult(null);
    setError(null);
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
          Import CSV edifici
        </h1>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)' }}>
          Incolla un file CSV con header. La validazione non scrive sul database: solo il commit importa i record.
        </p>
      </header>

      {/* ---- Header richiesto ---- */}
      <section className="tepo-card tepo-card--flat">
        <h2 className="tepo-card__title">Header richiesto</h2>
        <pre
          style={{
            margin: 'var(--space-2) 0 0',
            padding: 'var(--space-3)',
            background: 'var(--color-surface-sunken)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-xs)',
            overflowX: 'auto',
            color: 'var(--color-text-secondary)'
          }}
        >
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
        </pre>
        <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Separatore: virgola. Decimali: punto o virgola. Encoding: UTF-8 (BOM tollerato). Righe vuote ignorate.
        </p>
      </section>

      {/* ---- Editor ---- */}
      <section className="tepo-card">
        <div className="tepo-card__header">
          <h2 className="tepo-card__title">Contenuto CSV</h2>
          <button
            className="tepo-button tepo-button--ghost tepo-button--sm"
            onClick={loadExample}
            type="button"
          >
            Carica esempio
          </button>
        </div>

        <textarea
          className="tepo-textarea"
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Incolla qui il contenuto CSV"
          style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}
        />

        <div className="tepo-card__footer">
          <button
            className="tepo-button tepo-button--secondary"
            onClick={doValidate}
            disabled={!content.trim() || loadingValidate}
          >
            {loadingValidate ? 'Validazione in corso…' : 'Valida'}
          </button>
          <button
            className="tepo-button tepo-button--primary"
            onClick={doCommit}
            disabled={!preview || preview.valid === 0 || loadingCommit}
          >
            {loadingCommit ? 'Importazione in corso…' : 'Importa record validi'}
          </button>
        </div>
      </section>

      {/* ---- Errore ---- */}
      {error && (
        <div
          className="tepo-card"
          role="alert"
          style={{
            borderColor: 'var(--color-brand-danger)',
            color: 'var(--color-state-danger-fg)',
            background: 'var(--color-state-danger-bg)'
          }}
        >
          {error}
        </div>
      )}

      {/* ---- Preview ---- */}
      {preview && (
        <section className="tepo-card">
          <div className="tepo-card__header">
            <div>
              <h2 className="tepo-card__title">Anteprima validazione</h2>
              <p className="tepo-card__subtitle">
                Nessuna scrittura è stata eseguita. Verifica gli errori prima di importare.
              </p>
            </div>
            <div className="tepo-cluster">
              <span className="tepo-badge tepo-badge--success">
                {preview.valid} validi
              </span>
              {preview.invalid > 0 && (
                <span className="tepo-badge tepo-badge--danger">
                  {preview.invalid} invalidi
                </span>
              )}
            </div>
          </div>

          <table className="tepo-table tepo-table--compact">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Riga</th>
                <th style={{ width: 140 }}>ID</th>
                <th>Errori</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r: any) => {
                const hasErrors = r.errors && r.errors.length > 0;
                return (
                  <tr key={r.rowNumber}>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.rowNumber}</td>
                    <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                      {r.id || '—'}
                    </td>
                    <td>
                      {hasErrors ? (
                        <span style={{ color: 'var(--color-state-danger-fg)' }}>
                          {r.errors.join('; ')}
                        </span>
                      ) : (
                        <span className="tepo-badge tepo-badge--success">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {preview.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      padding: 'var(--space-6)'
                    }}
                  >
                    Nessuna riga da mostrare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* ---- Risultato import ---- */}
      {result && (
        <section className="tepo-card">
          <div className="tepo-card__header">
            <h2 className="tepo-card__title">Risultato import</h2>
            <div className="tepo-cluster">
              <span className="tepo-badge tepo-badge--success">
                {result.inserted} inseriti
              </span>
              {result.skipped > 0 && (
                <span className="tepo-badge tepo-badge--warning">
                  {result.skipped} saltati
                </span>
              )}
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            I record importati sono visibili nella pagina <strong>Edifici</strong> e sulla mappa.
          </p>
        </section>
      )}
    </div>
  );
}