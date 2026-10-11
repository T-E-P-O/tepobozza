package it.unitn.tepo.ai.llm;

/**
 * Client verso un provider LLM. Il contratto è minimale: dati system+user prompt,
 * restituisce il testo generato. Errori di rete, timeout, HTTP non-2xx e risposte
 * malformate vengono esposti come LlmClientException.
 */
public interface LlmClient {

    /** Invia il prompt e restituisce il testo generato. */
    String complete(String systemPrompt, String userPrompt);
}