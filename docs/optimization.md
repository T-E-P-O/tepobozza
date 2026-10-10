## Reason code delle spiegazioni

Le spiegazioni prodotte da `ExplanationService` sono deterministiche e classificate
in due famiglie.

### Barriere locali (dimostrate)

Verificano cosa accadrebbe **aggiungendo l'opzione al portafoglio corrente**, senza
sostituzioni. Non provano che l'opzione non possa entrare in ogni portafoglio
ammissibile.

| Reason code | Significato |
|---|---|
| `ESCLUSO_INCOMPATIBILITA` | L'aggiunta viola un'incompatibilità con un'opzione già selezionata. |
| `ESCLUSO_PREREQUISITO` | L'aggiunta richiede un prerequisito non selezionato. |
| `ESCLUSO_BUDGET_TOTALE` | L'opzione da sola supera il budget totale dello scenario. |
| `ESCLUSO_BUDGET_RESIDUO` | L'opzione non entra nel budget residuo senza sostituzioni. |

### Causa non determinata

| Reason code | Significato |
|---|---|
| `ESCLUSO_NON_OTTIMALE` | L'opzione è esclusa dall'ottimo, ma la causa specifica non è deducibile dal solo risultato corrente. Richiederebbe un'analisi controfattuale (ricalcolo forzato `x_i = 1`). |

### Selezioni

| Reason code | Significato |
|---|---|
| `SELEZIONATO` | Selezionato perché contribuisce all'obiettivo e rispetta vincoli e budget. |
| `SELEZIONATO_PREREQUISITO` | Selezionato come prerequisito per un altro intervento, pur non contribuendo direttamente all'obiettivo (benefici nulli). |

### Limite dichiarato

Le spiegazioni non sostituiscono il giudizio tecnico o amministrativo. Non promettono
una prova di causalità globale. La distinzione tra barriera locale e causa non
determinata è esplicita nel codice e nei test.