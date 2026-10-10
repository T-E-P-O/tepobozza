package it.unitn.tepo.ai;

import it.unitn.tepo.domain.Objective;

import java.util.List;

public record ScenarioProposal(
        long budgetCents,
        Objective objective,
        List<String> candidateOptionIds,
        String explanation
) {}