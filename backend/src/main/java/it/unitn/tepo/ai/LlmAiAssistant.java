package it.unitn.tepo.ai;

import it.unitn.tepo.application.InterventionOptionRepository;
import it.unitn.tepo.domain.Objective;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Profile("llm")
public class LlmAiAssistant implements AiAssistant {

    private final InterventionOptionRepository optionRepo;

    @Value("${llm.api.key:}")
    private String apiKey;

    public LlmAiAssistant(InterventionOptionRepository optionRepo) {
        this.optionRepo = optionRepo;
    }

    @Override
    public ScenarioProposal propose(String text) {
        // TODO: chiamare LLM esterno se apiKey non è vuota.
        // Fallback deterministico se manca la chiave.
        if (apiKey == null || apiKey.isEmpty()) {
            return new RuleBasedAiAssistant(optionRepo).propose(text);
        }
        // Placeholder: implementare client HTTP.
        // L'LLM deve restituire solo parametri validati; l'utente conferma prima del run.
        return new RuleBasedAiAssistant(optionRepo).propose(text);
    }
}