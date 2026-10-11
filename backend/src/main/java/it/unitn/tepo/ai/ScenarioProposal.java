package it.unitn.tepo.ai;

import it.unitn.tepo.domain.Objective;

import java.util.List;

/**
 * Proposta di parametri di scenario prodotta da un assistente.
 * Non è un comando: va sempre revisionata dall'operatore prima dell'applicazione.
 */
public record ScenarioProposal(
        long budgetCents,
        Objective objective,
        List<String> candidateOptionIds,
        String explanation,
        ProposalSource source,
        List<String> missingInformation,
        List<String> warnings,
        boolean requiresHumanReview
) {

    public enum ProposalSource {
        RULE_BASED,
        LLM,
        LLM_FALLBACK_RULE_BASED
    }

    /** Costruttore retro-compatibile: proposta rule-based pura, nessun warning. */
    public ScenarioProposal(long budgetCents, Objective objective,
                            List<String> candidateOptionIds, String explanation) {
        this(budgetCents, objective, candidateOptionIds, explanation,
                ProposalSource.RULE_BASED, List.of(), List.of(), true);
    }
}