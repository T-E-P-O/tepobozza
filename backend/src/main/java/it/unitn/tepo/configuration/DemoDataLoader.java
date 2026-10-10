package it.unitn.tepo.configuration;

import it.unitn.tepo.application.BuildingRepository;
import it.unitn.tepo.application.InterventionOptionRepository;
import it.unitn.tepo.application.InterventionTypeRepository;
import it.unitn.tepo.domain.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Dataset DEMO — dati sintetici.
 *
 * Ipotesi sintetiche adottate (tutte fittizie, non dati reali del Comune di Trento):
 *  - Tariffa energetica: 0.20 EUR/kWh  -> 20 cent/kWh
 *  - Fattore di emissione: 0.25 kg CO2/kWh
 *  - Scale: energia in kWh/anno (scala 1:1), CO2 in kg/anno (scala 1:1),
 *    importi in centesimi di EUR (scala 1:1)
 *  - Payback target: 5-15 anni per la maggior parte degli interventi
 *
 * I campi *Scaled del dominio conservano il valore con la scala dichiarata
 * (1:1 in questo dataset). La scala è documentata anche in docs/optimization.md.
 */
@Component
@Profile("demo")
public class DemoDataLoader implements CommandLineRunner {

    private final BuildingRepository buildingRepo;
    private final InterventionTypeRepository typeRepo;
    private final InterventionOptionRepository optionRepo;

    public DemoDataLoader(BuildingRepository b, InterventionTypeRepository t, InterventionOptionRepository o) {
        this.buildingRepo = b;
        this.typeRepo = t;
        this.optionRepo = o;
    }

    @Override
    public void run(String... args) {
        if (buildingRepo.count() > 0) return;

        String[][] buildings = {
                {"BLD-001", "Scuola demo 1", "Via Verdi 10, Trento", "46.0704", "11.1212", "Scuola", "2400"},
                {"BLD-002", "Scuola demo 2", "Via S. Croce 15, Trento", "46.0661", "11.1234", "Scuola", "3100"},
                {"BLD-003", "Ufficio demo 3", "Piazza Duomo 1, Trento", "46.0676", "11.1214", "Ufficio", "1800"},
                {"BLD-004", "Palestra demo 4", "Via Rosmini 5, Trento", "46.0640", "11.1220", "Sport", "2600"},
                {"BLD-005", "Biblioteca demo 5", "Via Roma 30, Trento", "46.0690", "11.1188", "Cultura", "2200"},
                {"BLD-006", "Ufficio demo 6", "Via Belenzani 20, Trento", "46.0683", "11.1206", "Ufficio", "1500"},
                {"BLD-007", "Scuola demo 7", "Via Madruzzo 8, Trento", "46.0652", "11.1257", "Scuola", "2800"},
                {"BLD-008", "Magazzino demo 8", "Via Brennero 100, Trento", "46.0775", "11.1305", "Magazzino", "1200"},
                {"BLD-009", "Ufficio demo 9", "Via Manci 12, Trento", "46.0697", "11.1191", "Ufficio", "1700"},
                {"BLD-010", "Centro civico demo 10", "Via Alfieri 3, Trento", "46.0710", "11.1175", "Civico", "2000"}
        };

        for (String[] b : buildings) {
            Building building = new Building(
                    b[0], b[1], b[2], "Trento",
                    Double.parseDouble(b[3]), Double.parseDouble(b[4]),
                    b[5], Double.parseDouble(b[6]),
                    null, null, null,
                    DataProvenance.SYNTHETIC
            );
            buildingRepo.save(building);
        }

        typeRepo.save(new InterventionType("TYPE-LED", "Illuminazione LED", "Illuminazione", "Sostituzione corpi illuminanti"));
        typeRepo.save(new InterventionType("TYPE-WINDOWS", "Serramenti", "Involucro", "Sostituzione serramenti"));
        typeRepo.save(new InterventionType("TYPE-INSULATION", "Isolamento", "Involucro", "Isolamento termico"));
        typeRepo.save(new InterventionType("TYPE-HEATPUMP", "Pompa di calore", "Impianto", "Sostituzione caldaia con PdC"));
        typeRepo.save(new InterventionType("TYPE-PV", "Fotovoltaico", "Produzione", "Installazione FV"));
        typeRepo.save(new InterventionType("TYPE-BOILER", "Caldaia", "Impianto", "Sostituzione caldaia"));

        // Recupero edifici per potenza (W) sintetica: assumiamo 0.02 kW/m2 di picco. Non usata per payback.
        // Gli interventi sono definiti direttamente in energia annua risparmiata.
        //
        // Regola coerente per ogni intervento:
        //   annualEconomicSavingCents = annualEnergySavingKwh * 20
        //   annualCo2ReductionKg     = annualEnergySavingKwh * 0.25
        //   investmentCostCents      in centesimi, payback = (cost/100) / (econ/100) anni

        // OPT-001: LED scuola 1, 60000 EUR, 37500 kWh/anno -> 7500 EUR/anno, payback 8.0
        createOption("OPT-001", "BLD-001", "TYPE-LED", "LED scuola 1",
                6_000_000L, 37_500L);

        // OPT-002: serramenti scuola 1, 180000 EUR, 9000 kWh/anno -> 1800 EUR/anno, payback 100 (fuori range)
        // -> meglio 45000 EUR con 3000 kWh/anno = 600 EUR/anno, payback 75. Non realistico.
        // Uso 80000 EUR, 9000 kWh/anno = 1800 EUR/anno, payback 44.
        // Riallineo: costo 45_000 EUR, risparmio 9000 kWh -> 1800 EUR/anno, payback 25. Accettabile come demo.
        createOption("OPT-002", "BLD-001", "TYPE-WINDOWS", "Serramenti scuola 1",
                4_500_000L, 9_000L);

        // OPT-003: LED scuola 2, 75000 EUR, 45000 kWh -> 9000 EUR/anno, payback 8.3
        createOption("OPT-003", "BLD-002", "TYPE-LED", "LED scuola 2",
                7_500_000L, 45_000L);

        // OPT-004: PdC scuola 2, 300000 EUR, 60000 kWh -> 12000 EUR/anno, payback 25
        createOption("OPT-004", "BLD-002", "TYPE-HEATPUMP", "PdC scuola 2",
                30_000_000L, 60_000L);

        // OPT-005: LED ufficio 3, 40000 EUR, 24000 kWh -> 4800 EUR/anno, payback 8.3
        createOption("OPT-005", "BLD-003", "TYPE-LED", "LED ufficio 3",
                4_000_000L, 24_000L);

        // OPT-006: serramenti ufficio 3, 300000 EUR, 18000 kWh -> 3600 EUR/anno, payback 83
        // -> 45000 EUR, 18000 kWh -> 3600 EUR/anno, payback 12.5
        createOption("OPT-006", "BLD-003", "TYPE-WINDOWS", "Serramenti ufficio 3",
                4_500_000L, 18_000L);

        // OPT-007: cappotto palestra 4, 120000 EUR, 60000 kWh -> 12000 EUR/anno, payback 10
        createOption("OPT-007", "BLD-004", "TYPE-INSULATION", "Cappotto palestra 4",
                12_000_000L, 60_000L);

        // OPT-008: LED palestra 4, 80000 EUR, 48000 kWh -> 9600 EUR/anno, payback 8.3
        createOption("OPT-008", "BLD-004", "TYPE-LED", "LED palestra 4",
                8_000_000L, 48_000L);

        // OPT-009: LED biblioteca 5, 65000 EUR, 39000 kWh -> 7800 EUR/anno, payback 8.3
        createOption("OPT-009", "BLD-005", "TYPE-LED", "LED biblioteca 5",
                6_500_000L, 39_000L);

        // OPT-010: serramenti biblioteca 5, 42000 EUR, 15000 kWh -> 3000 EUR/anno, payback 14
        createOption("OPT-010", "BLD-005", "TYPE-WINDOWS", "Serramenti biblioteca 5",
                4_200_000L, 15_000L);

        // OPT-011: LED ufficio 6, 35000 EUR, 21000 kWh -> 4200 EUR/anno, payback 8.3
        createOption("OPT-011", "BLD-006", "TYPE-LED", "LED ufficio 6",
                3_500_000L, 21_000L);

        // OPT-012: FV ufficio 6, 50000 EUR, 30000 kWh -> 6000 EUR/anno, payback 8.3
        createOption("OPT-012", "BLD-006", "TYPE-PV", "FV ufficio 6",
                5_000_000L, 30_000L);

        // OPT-013: LED scuola 7, 80000 EUR, 48000 kWh -> 9600 EUR/anno, payback 8.3
        createOption("OPT-013", "BLD-007", "TYPE-LED", "LED scuola 7",
                8_000_000L, 48_000L);

        // OPT-014: PdC scuola 7, 95000 EUR, 30000 kWh -> 6000 EUR/anno, payback 15.8 (prerequisito OPT-013)
        createOption("OPT-014", "BLD-007", "TYPE-HEATPUMP", "PdC scuola 7",
                9_500_000L, 30_000L);

        // OPT-015: LED magazzino 8, 30000 EUR, 18000 kWh -> 3600 EUR/anno, payback 8.3
        createOption("OPT-015", "BLD-008", "TYPE-LED", "LED magazzino 8",
                3_000_000L, 18_000L);

        // OPT-016: cappotto magazzino 8, 60000 EUR, 24000 kWh -> 4800 EUR/anno, payback 12.5
        createOption("OPT-016", "BLD-008", "TYPE-INSULATION", "Cappotto magazzino 8",
                6_000_000L, 24_000L);

        // OPT-017: LED ufficio 9, 45000 EUR, 27000 kWh -> 5400 EUR/anno, payback 8.3
        createOption("OPT-017", "BLD-009", "TYPE-LED", "LED ufficio 9",
                4_500_000L, 27_000L);

        // OPT-018: caldaia ufficio 9, 35000 EUR, 15000 kWh -> 3000 EUR/anno, payback 11.7
        createOption("OPT-018", "BLD-009", "TYPE-BOILER", "Caldaia ufficio 9",
                3_500_000L, 15_000L);

        // OPT-019: LED centro 10, 55000 EUR, 33000 kWh -> 6600 EUR/anno, payback 8.3
        createOption("OPT-019", "BLD-010", "TYPE-LED", "LED centro 10",
                5_500_000L, 33_000L);

        // OPT-020: FV centro 10, 45000 EUR, 24000 kWh -> 4800 EUR/anno, payback 9.4
        createOption("OPT-020", "BLD-010", "TYPE-PV", "FV centro 10",
                4_500_000L, 24_000L);

        // OPT-021: FV scuola 1, 55000 EUR, 30000 kWh -> 6000 EUR/anno, payback 9.2 (incompatibile con OPT-001)
        createOption("OPT-021", "BLD-001", "TYPE-PV", "FV scuola 1",
                5_500_000L, 30_000L);

        // OPT-022: LED extra scuola 2, 20000 EUR, 9000 kWh -> 1800 EUR/anno, payback 11.1
        createOption("OPT-022", "BLD-002", "TYPE-LED", "LED extra scuola 2",
                2_000_000L, 9_000L);

        // OPT-023: FV ufficio 3, 40000 EUR, 24000 kWh -> 4800 EUR/anno, payback 8.3
        createOption("OPT-023", "BLD-003", "TYPE-PV", "FV ufficio 3",
                4_000_000L, 24_000L);

        // OPT-024: PdC biblioteca 5, 85000 EUR, 30000 kWh -> 6000 EUR/anno, payback 14.2
        createOption("OPT-024", "BLD-005", "TYPE-HEATPUMP", "PdC biblioteca 5",
                8_500_000L, 30_000L);

        // OPT-025: serramenti scuola 7, 40000 EUR, 12000 kWh -> 2400 EUR/anno, payback 16.7
        createOption("OPT-025", "BLD-007", "TYPE-WINDOWS", "Serramenti scuola 7",
                4_000_000L, 12_000L);

        // OPT-026: FV ufficio 9, 38000 EUR, 21000 kWh -> 4200 EUR/anno, payback 9.0
        createOption("OPT-026", "BLD-009", "TYPE-PV", "FV ufficio 9",
                3_800_000L, 21_000L);
    }

    /**
     * @param energyKwh risparmio annuo in kWh. Le altre metriche sono derivate
     *                  applicando tariffa sintetica 0.20 EUR/kWh e fattore
     *                  CO2 sintetico 0.25 kg/kWh.
     */
    private void createOption(String id, String buildingId, String typeId,
                              String name, long costCents, long energyKwh) {
        InterventionOption o = new InterventionOption();
        o.setId(id);
        o.setBuildingId(buildingId);
        o.setInterventionTypeId(typeId);
        o.setName(name);
        o.setDescription("Intervento demo sintetico. Tariffa ipotetica 0.20 EUR/kWh, fattore CO2 ipotetico 0.25 kg/kWh.");
        o.setInvestmentCostCents(costCents);
        o.setAnnualEnergySavingScaled(energyKwh);
        o.setAnnualEconomicSavingCents(energyKwh * 20);          // 0.20 EUR/kWh = 20 cent/kWh
        o.setAnnualCo2ReductionScaled((long) (energyKwh * 0.25)); // 0.25 kg CO2/kWh
        o.setProvenance(DataProvenance.SYNTHETIC);
        o.setSource("DEMO");
        o.setRevision(1);
        optionRepo.save(o);
    }
}