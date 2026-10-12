package it.unitn.tepo.configuration;

import it.unitn.tepo.application.BuildingRepository;
import it.unitn.tepo.application.InterventionOptionRepository;
import it.unitn.tepo.application.InterventionTypeRepository;
import it.unitn.tepo.domain.InterventionOption;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifica che il dataset demo sia internamente coerente.
 *
 * Dopo la Fase E, il dataset usa due vettori energetici con coppie
 * (tariffa, fattore CO2) distinte:
 *   - Elettricità (LED, FV):  0.25 EUR/kWh, 0.10 kg CO2/kWh
 *   - Gas metano (involucro, impianti): 0.10 EUR/kWh, 0.20 kg CO2/kWh
 *
 * Le due coppie sono scorrelate: le tre funzioni obiettivo
 * (ENERGY_SAVING, ECONOMIC_SAVING, CO2_REDUCTION) sono matematicamente
 * distinte sul catalogo. Questo test lo verifica esplicitamente.
 *
 * Usa H2 in-memory (profilo "test") e istanzia DemoDataLoader manualmente,
 * perché la classe è annotata @Profile("demo") e non è disponibile come bean
 * nel contesto di test.
 */
@SpringBootTest
@ActiveProfiles("test")
class DemoDatasetCoherenceTest {

    @Autowired
    private BuildingRepository buildingRepo;

    @Autowired
    private InterventionTypeRepository typeRepo;

    @Autowired
    private InterventionOptionRepository optionRepo;

    @BeforeEach
    void setUp() {
        optionRepo.deleteAll();
        typeRepo.deleteAll();
        buildingRepo.deleteAll();
        new DemoDataLoader(buildingRepo, typeRepo, optionRepo).run();
    }

    // ---- Conteggi e provenienza ----

    @Test
    void datasetContainsExpectedCounts() {
        assertEquals(10, buildingRepo.count(), "Attesi 10 edifici");
        assertEquals(6, typeRepo.count(), "Attese 6 tipologie");
        assertEquals(26, optionRepo.count(), "Attesi 26 interventi");
    }

    @Test
    void provenanceIsSyntheticForAllOptions() {
        for (InterventionOption o : optionRepo.findAll()) {
            assertEquals("SYNTHETIC", o.getProvenance().name(),
                    "Intervento " + o.getId() + " non marcato SYNTHETIC");
        }
    }

    // ---- Coerenza per vettore energetico ----

    @Test
    void economicSavingMatchesVectorSpecificTariff() {
        for (InterventionOption o : optionRepo.findAll()) {
            long kwh = o.getAnnualEnergySavingScaled();
            double tariff = isElectric(o.getInterventionTypeId()) ? 0.25 : 0.10;
            long expected = Math.round(kwh * tariff * 100.0);
            assertEquals(expected, o.getAnnualEconomicSavingCents(),
                    "Mismatch economicSaving su " + o.getId()
                            + " (type=" + o.getInterventionTypeId() + "): "
                            + "atteso " + expected + ", trovato " + o.getAnnualEconomicSavingCents());
        }
    }

    @Test
    void co2ReductionMatchesVectorSpecificFactor() {
        for (InterventionOption o : optionRepo.findAll()) {
            long kwh = o.getAnnualEnergySavingScaled();
            double factor = isElectric(o.getInterventionTypeId()) ? 0.10 : 0.20;
            long expected = Math.round(kwh * factor);
            assertEquals(expected, o.getAnnualCo2ReductionScaled(),
                    "Mismatch co2Reduction su " + o.getId()
                            + " (type=" + o.getInterventionTypeId() + "): "
                            + "atteso " + expected + ", trovato " + o.getAnnualCo2ReductionScaled());
        }
    }

    // ---- Discriminazione delle funzioni obiettivo ----

    /**
     * Se il rapporto economic/energy fosse costante su tutto il catalogo,
     * massimizzare energia e massimizzare economia sarebbero equivalenti.
     * Il test richiede che il catalogo contenga almeno due rapporti distinti.
     */
    @Test
    void economicToEnergyRatioIsNotConstantAcrossCatalog() {
        Set<Long> ratios = new HashSet<>();
        for (InterventionOption o : optionRepo.findAll()) {
            long kwh = o.getAnnualEnergySavingScaled();
            if (kwh == 0) continue;
            long econ = o.getAnnualEconomicSavingCents();
            // Rapporto cents/kWh, intero (i valori del dataset sono esatti)
            long ratio = Math.round((double) econ / kwh);
            ratios.add(ratio);
        }
        assertTrue(ratios.size() >= 2,
                "Rapporto economic/energy costante su tutte le opzioni: "
                        + "obiettivi ENERGY_SAVING ed ECONOMIC_SAVING equivalenti. "
                        + "Valori trovati: " + ratios);
    }

    /**
     * Simmetrico al test precedente, per CO2 vs energy.
     */
    @Test
    void co2ToEnergyRatioIsNotConstantAcrossCatalog() {
        Set<Long> ratiosX100 = new HashSet<>();
        for (InterventionOption o : optionRepo.findAll()) {
            long kwh = o.getAnnualEnergySavingScaled();
            if (kwh == 0) continue;
            long co2 = o.getAnnualCo2ReductionScaled();
            // kg CO2 per 100 kWh, arrotondato (10 = 0.10 kg/kWh, 20 = 0.20 kg/kWh)
            long r = Math.round(co2 * 100.0 / kwh);
            ratiosX100.add(r);
        }
        assertTrue(ratiosX100.size() >= 2,
                "Rapporto co2/energy costante su tutte le opzioni: "
                        + "obiettivi ENERGY_SAVING e CO2_REDUCTION equivalenti. "
                        + "Valori trovati (kg CO2 per 100 kWh): " + ratiosX100);
    }

    // ---- Payback ----

    @Test
    void paybackInReasonableRangeForMostInterventions() {
        int plausibles = 0;
        int total = 0;
        for (InterventionOption o : optionRepo.findAll()) {
            if (o.getAnnualEconomicSavingCents() <= 0) continue;
            total++;
            double payback = ((double) o.getInvestmentCostCents())
                    / o.getAnnualEconomicSavingCents();
            if (payback >= 3.0 && payback <= 30.0) plausibles++;
        }
        assertTrue(total > 0, "Nessun intervento con risparmio economico positivo");
        // Soglia 75%: alcuni outlier restano accettabili (es. serramenti con
        // payback lungo su riscaldamento a gas), ma non devono dominare.
        assertTrue(plausibles >= total * 0.75,
                "Payback plausibile solo per " + plausibles + "/" + total + " interventi");
    }

    // ---- Helper ----

    private static boolean isElectric(String typeId) {
        return "TYPE-LED".equals(typeId) || "TYPE-PV".equals(typeId);
    }
}