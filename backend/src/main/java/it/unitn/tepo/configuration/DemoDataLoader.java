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
 *
 *  - L'energia risparmiata è misurata in kWh/anno del vettore energetico
 *    effettivamente non consumato (elettricità o gas metano).
 *  - Ogni vettore ha una coppia (tariffa, fattore di emissione) distinta:
 *
 *      Elettricità (grid Trentino, idro-dominante):
 *        tariffa  0.25 EUR/kWh = 25 cent/kWh
 *        fattore  0.10 kg CO2/kWh
 *
 *      Gas metano:
 *        tariffa  0.10 EUR/kWh = 10 cent/kWh
 *        fattore  0.20 kg CO2/kWh
 *
 *  - Le due coppie sono scorrelate: l'elettricità è più costosa ma più pulita,
 *    il gas è più economico ma più sporco. Questo rende le tre funzioni
 *    obiettivo (ENERGY_SAVING, ECONOMIC_SAVING, CO2_REDUCTION) matematicamente
 *    distinte sul catalogo.
 *
 *  - Scala: energia in kWh/anno (1:1), CO2 in kg/anno (1:1), importi in cent.
 *  - Payback target: 5-25 anni per la maggior parte degli interventi.
 *
 * I campi *Scaled del dominio conservano il valore con la scala dichiarata.
 * La scala è documentata anche in docs/optimization.md.
 */
@Component
@Profile("demo")
public class DemoDataLoader implements CommandLineRunner {

    // ---- Fattori per vettore energetico (ipotesi sintetiche dichiarate) ----

    private static final double TARIFF_ELECTRICITY_EUR_PER_KWH = 0.25;
    private static final double CO2_ELECTRICITY_KG_PER_KWH     = 0.10;
    private static final double TARIFF_GAS_EUR_PER_KWH         = 0.10;
    private static final double CO2_GAS_KG_PER_KWH             = 0.20;

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

        // Regola per ogni intervento (dipende dal vettore energetico):
        //   annualEconomicSavingCents = round(energyKwh * tariffa * 100)
        //   annualCo2ReductionKg      = round(energyKwh * fattoreCO2)
        // I valori di tariffa e fattore dipendono dal typeId (elettricità o gas).

        // ---- Elettricità (LED, FV) ----

        createOption("OPT-001", "BLD-001", "TYPE-LED", "LED scuola 1",         6_000_000L, 37_500L);
        createOption("OPT-003", "BLD-002", "TYPE-LED", "LED scuola 2",         7_500_000L, 45_000L);
        createOption("OPT-005", "BLD-003", "TYPE-LED", "LED ufficio 3",        4_000_000L, 24_000L);
        createOption("OPT-008", "BLD-004", "TYPE-LED", "LED palestra 4",       8_000_000L, 48_000L);
        createOption("OPT-009", "BLD-005", "TYPE-LED", "LED biblioteca 5",     6_500_000L, 39_000L);
        createOption("OPT-011", "BLD-006", "TYPE-LED", "LED ufficio 6",        3_500_000L, 21_000L);
        createOption("OPT-012", "BLD-006", "TYPE-PV",  "FV ufficio 6",         5_000_000L, 30_000L);
        createOption("OPT-013", "BLD-007", "TYPE-LED", "LED scuola 7",         8_000_000L, 48_000L);
        createOption("OPT-015", "BLD-008", "TYPE-LED", "LED magazzino 8",      3_000_000L, 18_000L);
        createOption("OPT-017", "BLD-009", "TYPE-LED", "LED ufficio 9",        4_500_000L, 27_000L);
        createOption("OPT-019", "BLD-010", "TYPE-LED", "LED centro 10",        5_500_000L, 33_000L);
        createOption("OPT-020", "BLD-010", "TYPE-PV",  "FV centro 10",         4_500_000L, 24_000L);
        createOption("OPT-021", "BLD-001", "TYPE-PV",  "FV scuola 1",          5_500_000L, 30_000L);
        createOption("OPT-022", "BLD-002", "TYPE-LED", "LED extra scuola 2",   2_000_000L,  9_000L);
        createOption("OPT-023", "BLD-003", "TYPE-PV",  "FV ufficio 3",         4_000_000L, 24_000L);
        createOption("OPT-026", "BLD-009", "TYPE-PV",  "FV ufficio 9",         3_800_000L, 21_000L);

        // ---- Gas metano (serramenti, isolamento, PdC, caldaia) ----

        createOption("OPT-002", "BLD-001", "TYPE-WINDOWS",   "Serramenti scuola 1",    4_500_000L,  9_000L);
        createOption("OPT-004", "BLD-002", "TYPE-HEATPUMP",  "PdC scuola 2",          30_000_000L, 60_000L);
        createOption("OPT-006", "BLD-003", "TYPE-WINDOWS",   "Serramenti ufficio 3",   4_500_000L, 18_000L);
        createOption("OPT-007", "BLD-004", "TYPE-INSULATION","Cappotto palestra 4",   12_000_000L, 60_000L);
        createOption("OPT-010", "BLD-005", "TYPE-WINDOWS",   "Serramenti biblioteca 5",4_200_000L, 15_000L);
        createOption("OPT-014", "BLD-007", "TYPE-HEATPUMP",  "PdC scuola 7",           9_500_000L, 30_000L);
        createOption("OPT-016", "BLD-008", "TYPE-INSULATION","Cappotto magazzino 8",   6_000_000L, 24_000L);
        createOption("OPT-018", "BLD-009", "TYPE-BOILER",    "Caldaia ufficio 9",      3_500_000L, 15_000L);
        createOption("OPT-024", "BLD-005", "TYPE-HEATPUMP",  "PdC biblioteca 5",       8_500_000L, 30_000L);
        createOption("OPT-025", "BLD-007", "TYPE-WINDOWS",   "Serramenti scuola 7",    4_000_000L, 12_000L);
    }

    /**
     * @param energyKwh risparmio annuo in kWh del vettore energetico
     *                  effettivamente non consumato (elettricità o gas).
     *
     * Le altre metriche sono derivate applicando la coppia
     * (tariffa, fattore CO2) del vettore, secondo la tabella in testa alla classe.
     */
    private void createOption(String id, String buildingId, String typeId,
                              String name, long costCents, long energyKwh) {
        double tariff = isElectric(typeId) ? TARIFF_ELECTRICITY_EUR_PER_KWH : TARIFF_GAS_EUR_PER_KWH;
        double co2F   = isElectric(typeId) ? CO2_ELECTRICITY_KG_PER_KWH     : CO2_GAS_KG_PER_KWH;

        long economicCents = Math.round(energyKwh * tariff * 100.0);
        long co2Kg         = Math.round(energyKwh * co2F);

        InterventionOption o = new InterventionOption();
        o.setId(id);
        o.setBuildingId(buildingId);
        o.setInterventionTypeId(typeId);
        o.setName(name);
        o.setDescription(
                "Intervento demo sintetico. Vettore energetico: "
                        + (isElectric(typeId) ? "elettricità (tariffa 0.25 EUR/kWh, 0.10 kg CO2/kWh)"
                                              : "gas metano (tariffa 0.10 EUR/kWh, 0.20 kg CO2/kWh)")
        );
        o.setInvestmentCostCents(costCents);
        o.setAnnualEnergySavingScaled(energyKwh);
        o.setAnnualEconomicSavingCents(economicCents);
        o.setAnnualCo2ReductionScaled(co2Kg);
        o.setProvenance(DataProvenance.SYNTHETIC);
        o.setSource("DEMO");
        o.setRevision(1);
        optionRepo.save(o);
    }

    /** Elettricità (grid Trentino idro-dominante) vs gas metano. */
    private static boolean isElectric(String typeId) {
        return "TYPE-LED".equals(typeId) || "TYPE-PV".equals(typeId);
    }
}