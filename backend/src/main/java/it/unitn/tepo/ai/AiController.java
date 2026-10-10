package it.unitn.tepo.api;

import it.unitn.tepo.ai.AiAssistant;
import it.unitn.tepo.ai.ScenarioProposal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAssistant assistant;

    public AiController(AiAssistant assistant) {
        this.assistant = assistant;
    }

    @PostMapping("/propose")
    public ScenarioProposal propose(@RequestBody ProposalRequest request) {
        return assistant.propose(request.text());
    }

    public record ProposalRequest(String text) {}
}