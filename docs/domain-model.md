# Modello di dominio

## Entità

### Building
- id, name, address, municipality, latitude, longitude
- buildingType, surfaceM2
- annualEnergyConsumptionKwh, annualEnergyCostEur, annualCo2Kg
- provenance (REAL/SYNTHETIC/MIXED)

### InterventionType
- id, name, category, description

### InterventionOption
- id, buildingId, interventionTypeId
- name, description
- investmentCostCents (interi, centesimi)
- annualEnergySavingScaled
- annualEconomicSavingCents
- annualCo2ReductionScaled
- provenance, source, revision

## Distinzione fondamentale

- `InterventionType` = tipologia generale (es. "Illuminazione LED")
- `InterventionOption` = intervento concreto su un edificio

## Vincoli (nello scenario, non nel Building)

- `BudgetConstraint(budgetCents)`
- `IncompatibilityConstraint(optionA, optionB)` — simmetrica
- `PrerequisiteConstraint(option, requiredOption)`
- `MaxNumberConstraint(maxNumber, optionIds)`
- `IncludeConstraint(optionId)`
- `ExcludeConstraint(optionId)`

## Invarianti

- Ogni opzione ha Building e InterventionType esistenti.
- Costi e benefici appartengono all'opzione, non al tipo.
- Le incompatibilità sono simmetriche.
- Un ciclo di prerequisiti va segnalato e chiarito dal tecnico.
- Un piano conserva i valori usati nel calcolo.