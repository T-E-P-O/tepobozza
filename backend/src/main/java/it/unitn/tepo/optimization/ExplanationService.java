package it.unitn.tepo.optimization;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Produce spiegazioni deterministiche a partire dai dati e dai vincoli.
 *
 * Distinzione fondamentale:
 *  - Barriera locale (dimostrata): ESCLUSO_BUDGET_TOTALE, ESCLUSO_BUDGET_RESIDUO,
 *    ESCLUSO_INCOMPATIBILITA, ESCLUSO_PREREQUISITO.
 *    Verificano cosa accadrebbe aggiungendo l'opzione al portafoglio corrente,
 *    senza sostituzioni. Non provano che l'opzione non possa entrare in ogni
 *    portafoglio ammissibile.
 *  - Causa non determinata: ESCLUSO_NON_OTTIMALE.
 *    Nessuna barriera locale è dimostrabile. L'opzione è esclusa dall'ottimo,
 *    ma la causa specifica non è deducibile dal solo risultato corrente.
 *
 * Non viene mai dichiarata una causa univoca non supportata dai dati.
 */
@Service
public class ExplanationService {

    public List<Explanation> explain(OptimizationProblem problem, OptimizationResult result) {
        List<Explanation> explanations = new ArrayList<>();
        Set<String> selected = new HashSet<>(result.selectedOptionsId());
        Map<String, CandidateOption> byId = new HashMap<>();
        for (CandidateOption c : problem.candidateOptions()) {
            byId.put(c.id(), c);
        }

        // Pre-calcolo vincoli per lookup rapido
        Map<String, Set<String>> incompatibilities = new HashMap<>();
        Map<String, String> prerequisites = new HashMap<>();
        for (ScenarioConstraint constraint : problem.constraints()) {
            if (constraint instanceof ScenarioConstraint.IncompatibilityConstraint inc) {
                incompatibilities.computeIfAbsent(inc.optionA(), k -> new HashSet<>()).add(inc.optionB());
                incompatibilities.computeIfAbsent(inc.optionB(), k -> new HashSet<>()).add(inc.optionA());
            } else if (constraint instanceof ScenarioConstraint.PrerequisiteConstraint pre) {
                prerequisites.put(pre.option(), pre.requiredOption());
            }
        }

        long budgetResidual = problem.budgetCents() - result.totalInvestmentCents();

        for (String excludedId : result.excludedOptionsId()) {
            CandidateOption c = byId.get(excludedId);
            if (c == null) continue;
            explanations.add(diagnoseLocal(c, selected, incompatibilities, prerequisites,
                    problem.budgetCents(), budgetResidual));
        }

        for (String selectedId : result.selectedOptionsId()) {
            CandidateOption c = byId.get(selectedId);
            if (c == null) continue;
            explanations.add(explainSelected(c, prerequisites, selected));
        }

        return explanations;
    }

    private Explanation diagnoseLocal(CandidateOption c,
                                      Set<String> selected,
                                      Map<String, Set<String>> incompatibilities,
                                      Map<String, String> prerequisites,
                                      long totalBudget,
                                      long budgetResidual) {

        // 1) Incompatibilità con un selezionato
        Set<String> incomp = incompatibilities.getOrDefault(c.id(), Set.of());
        for (String other : incomp) {
            if (selected.contains(other)) {
                return new Explanation(c.id(), "ESCLUSO_INCOMPATIBILITA",
                        "L'aggiunta viola l'incompatibilità con " + other + " già selezionato.");
            }
        }

        // 2) Prerequisito non soddisfatto
        String required = prerequisites.get(c.id());
        if (required != null && !selected.contains(required)) {
            return new Explanation(c.id(), "ESCLUSO_PREREQUISITO",
                    "L'aggiunta richiede anche " + required + "; occorre ricalcolare il portafoglio.");
        }

        // 3) Budget totale insufficiente per l'opzione da sola
        if (c.investmentCostCents() > totalBudget) {
            return new Explanation(c.id(), "ESCLUSO_BUDGET_TOTALE",
                    "Questa opzione da sola supera il budget dello scenario.");
        }

        // 4) Budget residuo insufficiente per l'aggiunta singola
        if (c.investmentCostCents() > budgetResidual) {
            return new Explanation(c.id(), "ESCLUSO_BUDGET_RESIDUO",
                    "Non può essere aggiunta a questo piano senza modificare altre selezioni.");
        }

        // 5) Nessuna barriera locale dimostrabile
        return new Explanation(c.id(), "ESCLUSO_NON_OTTIMALE",
                "Non selezionata nella soluzione ottima; causa specifica non determinata dal solo risultato corrente.");
    }

    private Explanation explainSelected(CandidateOption c,
                                        Map<String, String> prerequisites,
                                        Set<String> selected) {
        boolean enablesOthers = prerequisites.values().stream().anyMatch(c.id()::equals);
        boolean zeroBenefit = c.annualEnergySavingScaled() == 0
                && c.annualEconomicSavingCents() == 0
                && c.annualCo2ReductionScaled() == 0;

        if (enablesOthers && zeroBenefit) {
            return new Explanation(c.id(), "SELEZIONATO_PREREQUISITO",
                    "Selezionato come prerequisito per un altro intervento; non contribuisce direttamente all'obiettivo.");
        }
        return new Explanation(c.id(), "SELEZIONATO",
                "Selezionato perché contribuisce all'obiettivo scelto e rispetta budget e vincoli dello scenario.");
    }
}