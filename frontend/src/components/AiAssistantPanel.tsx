import { useEffect, useState } from 'react';
import { fetchAiStatus, proposeWithAi } from '../services/api';
import type { AiStatus, ScenarioProposalDto, ScenarioProposalSource } from '../types';

type Props = {
  /** Tutti gli ID del catalogo corrente, usati per calcolare gli esclusi proposti. */
  allOptionIds: string[];
  /** Invocata quando l'utente accetta esplicitamente la proposta. */
  onApply: (proposal: ScenarioProposalDto) => void;
  /** Invocata con la lista di ID che l'AI propone di escludere (evidenziazione). */
  onExcludedIdsChange: (ids: string[]) => void;
};

function sourceLabel(s: ScenarioProposalSource): string {
  switch (s) {
    case 'LLM':
      return 'LLM';
    case 'LLM_FALLBACK_RULE_BASED':
      return 'LLM (fallback locale)';
    case 'RULE_BASED':
    default:
      return 'Regole locali';
  }
}

function sourceBadgeClass(s: ScenarioProposalSource): string {
  switch (s) {
    case 'LLM':
      return 'tepo-badge tepo-badge--info';
    case 'LLM_FALLBACK_RULE_BASED':
      return 'tepo-badge tepo-badge--warning';
    case 'RULE_BASED':
    default:
      return 'tepo-badge';
  }
}

export default function AiAssistantPanel({ allOptionIds, onApply, onExcludedIdsChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ScenarioProposalDto | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAiStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatusError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel = (): string => {
    if (statusError) return 'Stato AI non disponibile';
    if (!status) return 'Verifica stato…';
    return status.llmConfigured ? 'LLM attivo' : 'Modalità locale';
  };

  const statusBadgeClass = (): string => {
    if (statusError) return 'tepo-badge tepo-badge--warning';
    if (!status) return 'tepo-badge';
    return status.llmConfigured ? 'tepo-badge tepo-badge--info' : 'tepo-badge';
  };

  const computeExcluded = (p: ScenarioProposalDto): string[] => {
    const kept = new Set(p.candidateOptionIds);
    return allOptionIds.filter((id) => !kept.has(id));
  };

  const submit = async () => {
    setError(null);
    setProposal(null);
    onExcludedIdsChange([]);
    setLoading(true);
    try {
      const p = await proposeWithAi(text.trim());
      setProposal(p);
      onExcludedIdsChange(computeExcluded(p));
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!proposal) return;
    onApply(proposal);
    onExcludedIdsChange([]);
    setProposal(null);
  };

  const reject = () => {
    onExcludedIdsChange([]);
    setProposal(null);
  };

  const canSubmit = !loading && text.trim().length > 0;

  return (
    <section className="tepo-card" aria-label="Assistente AI">
      <div className="tepo-card__header">
        <div>
          <h2 className="tepo-card__title">Assistente AI</h2>
          <p className="tepo-card__subtitle">
            Traduce una richiesta in linguaggio naturale in una proposta di parametri di scenario.
            La proposta non viene applicata finché non la accetti esplicitamente.
          </p>
        </div>
        <div className="tepo-cluster">
          <span className={statusBadgeClass()}>{statusLabel()}</span>
          <button
            type="button"
            className="tepo-button tepo-button--ghost tepo-button--sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="tepo-ai-body"
          >
            {expanded ? 'Chiudi' : 'Apri'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id="tepo-ai-body"
          className="tepo-stack tepo-stack--tight"
          style={{ marginTop: 'var(--space-3)' }}
        >
          {status?.notes && status.notes.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: 'var(--space-4)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              {status.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}

          <label className="tepo-field">
            <span className="tepo-field__label">Descrivi lo scenario desiderato</span>
            <textarea
              className="tepo-textarea"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descrivi lo scenario in linguaggio naturale. Es: voglio ridurre la CO2 con un budget di 500k euro."
              disabled={loading}
            />
            <span className="tepo-field__help">
              L'assistente propone parametri di scenario. Il solver matematico resta l'autorità sul risultato.
            </span>
          </label>

          <div className="tepo-cluster">
            <button
              type="button"
              className="tepo-button tepo-button--primary tepo-button--sm"
              onClick={submit}
              disabled={!canSubmit}
            >
              {loading ? 'Interrogazione in corso…' : "Chiedi all'assistente"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="tepo-card tepo-card--flat"
              style={{
                borderColor: 'var(--color-brand-danger)',
                color: 'var(--color-state-danger-fg)',
                background: 'var(--color-state-danger-bg)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              {error}
            </div>
          )}

          {proposal && (
            <article
              className="tepo-card tepo-card--flat"
              aria-label="Proposta dell'assistente"
              style={{
                background: 'var(--color-surface-sunken)',
                marginTop: 'var(--space-2)'
              }}
            >
              <div className="tepo-card__header">
                <div>
                  <h3 className="tepo-card__title">Proposta dell'assistente</h3>
                  <p className="tepo-card__subtitle">
                    Revisiona i parametri. Nulla è stato applicato.
                  </p>
                </div>
                <span className={sourceBadgeClass(proposal.source)}>
                  {sourceLabel(proposal.source)}
                </span>
              </div>

              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-3)',
                  margin: 0
                }}
              >
                <div>
                  <dt
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)'
                    }}
                  >
                    Budget proposto
                  </dt>
                  <dd
                    style={{
                      margin: 'var(--space-1) 0 0',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    € {(proposal.budgetCents / 100).toLocaleString('it-IT')}
                  </dd>
                </div>
                <div>
                  <dt
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)'
                    }}
                  >
                    Obiettivo
                  </dt>
                  <dd
                    style={{
                      margin: 'var(--space-1) 0 0',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    {proposal.objective}
                  </dd>
                </div>
                <div>
                  <dt
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)'
                    }}
                  >
                    Candidati proposti
                  </dt>
                  <dd
                    style={{
                      margin: 'var(--space-1) 0 0',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    {proposal.candidateOptionIds.length} di {allOptionIds.length}
                  </dd>
                </div>
              </dl>

              {proposal.explanation && (
                <p
                  style={{
                    marginTop: 'var(--space-3)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <strong>Motivazione:</strong> {proposal.explanation}
                </p>
              )}

              {proposal.missingInformation.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    Informazioni mancanti
                  </h4>
                  <ul
                    style={{
                      margin: 'var(--space-1) 0 0',
                      paddingLeft: 'var(--space-4)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    {proposal.missingInformation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {proposal.warnings.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-state-warning-fg)'
                    }}
                  >
                    Avvertenze
                  </h4>
                  <ul
                    style={{
                      margin: 'var(--space-1) 0 0',
                      paddingLeft: 'var(--space-4)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-state-warning-fg)'
                    }}
                  >
                    {proposal.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {proposal.requiresHumanReview && (
                <p
                  role="note"
                  style={{
                    marginTop: 'var(--space-3)',
                    marginBottom: 0,
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-state-info-bg)',
                    color: 'var(--color-state-info-fg)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  Richiede revisione umana. La proposta non verrà applicata automaticamente.
                </p>
              )}

              <div
                className="tepo-card__footer"
                style={{ display: 'flex', gap: 'var(--space-2)' }}
              >
                <button
                  type="button"
                  className="tepo-button tepo-button--primary tepo-button--sm"
                  onClick={apply}
                >
                  Applica allo scenario
                </button>
                <button
                  type="button"
                  className="tepo-button tepo-button--secondary tepo-button--sm"
                  onClick={reject}
                >
                  Rifiuta
                </button>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}