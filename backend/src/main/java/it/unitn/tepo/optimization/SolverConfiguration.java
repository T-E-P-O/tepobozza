package it.unitn.tepo.optimization;

public record SolverConfiguration(int maxTimeSeconds) {
    public static SolverConfiguration defaultConfig() {
        return new SolverConfiguration(10);
    }
}