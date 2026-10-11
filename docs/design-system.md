# TEPO — Design system

Stato: **Fase A completata (predisposizione)**. I file CSS sono presenti ma
non ancora applicati ai componenti React. L'applicazione avverrà in Fase B.

## Filosofia visiva

Il design system di TEPO è pensato per un pubblico istituzionale: tecnici
comunali, funzionari, decisori. Deve comunicare affidabilità, precisione e
trasparenza. Non è un prodotto consumer.

Principi:
- **Sobrietà**: nessun ornamento gratuito, nessun gradiente decorativo.
- **Leggibilità**: contrasto adeguato, tipografia chiara, gerarchia netta.
- **Coerenza**: stesse regole su tutte le pagine.
- **Accessibilità**: navigazione da tastiera, focus visibile, contrasto WCAG AA.
- **Neutralità tematica**: nessun colore dipendente dal branding di terze parti.

## Token semantici

I token sono definiti in `frontend/src/styles/tokens.css` come custom properties
CSS. I nomi sono raggruppati per categoria:

- **Superfici**: `--color-bg-page`, `--color-surface`, `--color-surface-elevated`, `--color-surface-sunken`, `--color-bg-subtle`.
- **Testo**: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`.
- **Brand**: `--color-brand-primary`, `--color-brand-accent`, `--color-brand-accent-hover`, `--color-brand-success`, `--color-brand-warning`, `--color-brand-danger`, `--color-brand-info`.
- **Stati semantici** (sfondi e foreground tenui): `--color-state-{success|warning|danger|info|neutral}-{bg|fg}`.
- **Bordi**: `--color-border`, `--color-border-strong`, `--color-border-subtle`, `--color-divider`.
- **Focus ring**: `--color-focus-ring`, `--focus-ring-width`, `--focus-ring-offset`.
- **Tipografia**: `--font-family-sans`, `--font-family-mono`, `--font-size-*`, `--font-weight-*`, `--line-height-*`, `--letter-spacing-*`.
- **Spaziatura**: `--space-1` … `--space-16` (scala 4 px).
- **Raggi**: `--radius-xs` … `--radius-full`.
- **Ombre**: `--shadow-xs` … `--shadow-lg`.
- **Transizioni**: `--transition-{fast|base|slow}`, `--easing-{standard|emphasized}`.
- **Grafici**: `--chart-1` … `--chart-8`.

I token legacy `--tepo-blue`, `--tepo-bg`, `--tepo-text`, `--tepo-muted`,
`--tepo-border`, `--tepo-green`, `--tepo-blue-light` sono preservati con gli
stessi valori, per non alterare il rendering di `frontend/src/index.css`.

## Temi

Il design system predispone due temi:

- **Chiaro** (default): le variabili sono definite su `:root`.
- **Scuro**: si attiva applicando `data-theme="dark"` all'elemento `<html>`.
  Il selettore è definito in `tokens.css` ma non è cablato da nessun componente
  React in Fase A.

La commutazione runtime (pulsante, preferenza utente, `prefers-color-scheme`)
è responsabilità della Fase B.

## Tipografia

- **Font sans**: `system-ui` con fallback su Segoe UI, Roboto, Helvetica Neue, Arial.
- **Font mono**: stack monospaziato di sistema, per importi, ID, codice.
- **Scala**: da `xs` (12 px) a `4xl` (36 px).
- **Pesi**: 400, 500, 600, 700.
- **Interlinea**: `tight` (1.2), `normal` (1.5), `relaxed` (1.7).

## Spaziatura

Scala basata su 4 px. Usare sempre i token `--space-*`, mai valori hardcoded.

| Token | Valore |
|---|---|
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 20 px |
| `--space-6` | 24 px |
| `--space-8` | 32 px |
| `--space-10` | 40 px |
| `--space-12` | 48 px |
| `--space-16` | 64 px |

## Componenti disponibili

Classi definibili in `components.css`, tutte prefissate `tepo-`.

### Card
- `.tepo-card`, `.tepo-card--elevated`, `.tepo-card--flat`
- Sottocomponenti: `.tepo-card__header`, `.tepo-card__title`, `.tepo-card__subtitle`, `.tepo-card__body`, `.tepo-card__footer`

### Button
- Base: `.tepo-button`
- Varianti: `--primary`, `--secondary`, `--ghost`, `--danger`
- Dimensioni: `--sm`, `--lg`

### Badge
- Base: `.tepo-badge`
- Varianti: `--success`, `--warning`, `--danger`, `--info`

### Form
- `.tepo-field`, `.tepo-field__label`, `.tepo-field__help`, `.tepo-field__error`
- `.tepo-input`, `.tepo-select`, `.tepo-textarea`

### Table
- `.tepo-table`, `.tepo-table--compact`

### KPI
- `.tepo-kpi-grid`, `.tepo-kpi`, `.tepo-kpi__label`, `.tepo-kpi__value`, `.tepo-kpi__unit`, `.tepo-kpi__delta` (+ `--up`, `--down`)

### Layout
- `.tepo-stack` (+ `--tight`, `--loose`)
- `.tepo-cluster`
- `.tepo-divider`

### Accessibilità
- `.tepo-focus-ring`
- `.tepo-skip-link`
- `.tepo-sr-only`

## Accessibilità

- Focus visibile solo su `:focus-visible` (non su click).
- Outline di focus: 2 px su `--color-focus-ring`, offset 2 px.
- Contrasto testo/fondo verificato per WCAG AA su entrambi i temi.
- `prefers-reduced-motion` rispettato in `base.css`.
- `.tepo-sr-only` per etichette non visibili.
- `.tepo-skip-link` predisposto per saltare al contenuto.

## Convenzioni di naming

- Prefisso obbligatorio: `tepo-`.
- BEM semplificato: `tepo-block`, `tepo-block__element`, `tepo-block--modifier`.
- Token CSS: `--<categoria>-<sottocategoria>`, in kebab-case.
- Nessuna classe globale senza prefisso.

## Limiti attuali (Fase A)

- I file CSS non sono ancora importati nell'entry point.
- Nessun componente React usa le nuove classi.
- Il logo non è integrato: verrà in Fase B.
- Il tema scuro è definito ma non attivabile da UI.
- Il sistema non è ancora applicato a dashboard, tabelle, form.

## Procedura per applicare il sistema alle pagine esistenti

1. Verificare con `git diff` che non ci siano modifiche pendenti prima di iniziare.
2. Scegliere **una pagina alla volta**.
3. Sostituire le classi applicative esistenti (`.card`, `.kpi`, `button`, ecc.)
   con le corrispondenti `.tepo-*`, mantenendo il markup.
4. Non toccare la logica (props, stato, chiamate API).
5. Eseguire `npm run build` e `npm test` ad ogni pagina convertita.
6. Salvare screenshot prima/dopo per confronto visivo.
7. Aggiornare `docs/design-system.md` con eventuali varianti scoperte.

## Come estendere

- Nuovi colori: aggiungere un token semantico, non hardcodare.
- Nuovi componenti: prefisso `tepo-`, seguire BEM.
- Nuove dimensioni: usare la scala di spaziatura, non inventare valori.
- Nuovi stati: definire la coppia `--color-state-X-bg` / `-fg`.