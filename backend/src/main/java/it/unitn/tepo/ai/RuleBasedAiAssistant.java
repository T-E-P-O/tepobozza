package it.unitn.tepo.ai;

import it.unitn.tepo.application.InterventionOptionRepository;
import it.unitn.tepo.domain.Objective;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Primary
public class RuleBasedAiAssistant implements AiAssistant {

    private final InterventionOptionRepository optionRepo;

    public RuleBasedAiAssistant(InterventionOptionRepository optionRepo) {
        this.optionRepo = optionRepo;
    }

    @Override
    public ScenarioProposal propose(String text) {
        String lower = text == null ? "" : text.toLowerCase();

        Objective obj = Objective.ENERGY_SAVING;
        if (lower.contains("co2") || lower.contains("co₂") || lower.contains("emission")) {
            obj = Objective.CO2_REDUCTION;
        } else if (lower.contains("econom") || lower.contains("risparmio economic") || lower.contains("euro")) {
            obj = Objective.ECONOMIC_SAVING;
        }

        long budget = 500_000_00L; // 500k EUR di default
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(\\d{3,9})\\s*(k|mila|mila euro|m)?")
                .matcher(lower);
        if (m.find()) {
            long n = Long.parseLong(m.group(1));
            if ("k".equals(m.group(2)) || "mila".equals(m.group(2))) n *= 1000;
            budget = n * 100;
        }

        List<String> ids = optionRepo.findAll().stream()
                .map(o -> o.getId())
                .toList();

        return new ScenarioProposal(
                budget,
                obj,
                ids,
                "Proposta deterministica da testo: budget " + budget + " cent, obiettivo " + obj
        );
    }
}