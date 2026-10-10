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

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifica che il dataset demo sia internamente coerente.
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
        // Istanziazione manuale: il bean non è disponibile con profilo "test"
        new DemoDataLoader(buildingRepo, typeRepo, optionRepo).run();
    }

    @Test
    void datasetContainsExpectedCounts() {
        assertEquals(10, buildingRepo.count(), "Attesi 10 edifici");
        assertEquals(6, typeRepo.count(), "Attese 6 tipologie");
        assertEquals(26, optionRepo.count(), "Attesi 26 interventi");
    }

    @Test
    void economicSavingMatchesEnergyWithSyntheticTariff() {
        for (InterventionOption o : optionRepo.findAll()) {
            long expectedEcon = o.getAnnualEnergySavingScaled() * 20L;
            assertEquals(expectedEcon, o.getAnnualEconomicSavingCents(),
                    "Mismatch su " + o.getId()
                            + ": atteso " + expectedEcon
                            + ", trovato " + o.getAnnualEconomicSavingCents());
        }
    }

    @Test
    void co2SavingMatchesEnergyWithSyntheticFactor() {
        for (InterventionOption o : optionRepo.findAll()) {
            long expectedCo2 = (long) (o.getAnnualEnergySavingScaled() * 0.25);
            assertEquals(expectedCo2, o.getAnnualCo2ReductionScaled(),
                    "Mismatch CO2 su " + o.getId()
                            + ": atteso " + expectedCo2
                            + ", trovato " + o.getAnnualCo2ReductionScaled());
        }
    }

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
        assertTrue(plausibles >= total * 0.75,
                "Payback plausibile solo per " + plausibles + "/" + total + " interventi");
    }

    @Test
    void provenanceIsSyntheticForAllOptions() {
        for (InterventionOption o : optionRepo.findAll()) {
            assertEquals("SYNTHETIC", o.getProvenance().name(),
                    "Intervento " + o.getId() + " non marcato SYNTHETIC");
        }
    }
}