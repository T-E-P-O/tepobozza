#!/usr/bin/env pwsh
# Esegue i test backend in un container Maven/Temurin 21.
# Funziona su qualsiasi OS con Docker (Windows x86_64, Windows ARM64,
# Linux x86_64/ARM64, macOS Intel/Apple Silicon).
#
# Uso:
#   .\scripts\test-backend.ps1                                  # tutti i test
#   .\scripts\test-backend.ps1 -Test RuleBasedAiAssistantTest   # singola classe

param(
    [string]$Test = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$mvnArgs = "clean test"
if ($Test) { $mvnArgs += " -Dtest=$Test" }

Write-Host "Esecuzione test backend in container maven:3.9-eclipse-temurin-21..."
Write-Host "Comando: mvn -B $mvnArgs"
Write-Host ""

docker run --rm `
    -v "${root}:/workspace" `
    -w /workspace/backend `
    maven:3.9-eclipse-temurin-21 `
    mvn -B $mvnArgs