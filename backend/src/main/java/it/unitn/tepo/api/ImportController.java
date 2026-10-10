package it.unitn.tepo.api;

import it.unitn.tepo.application.BuildingRepository;
import it.unitn.tepo.application.InterventionOptionRepository;
import it.unitn.tepo.domain.Building;
import it.unitn.tepo.domain.DataProvenance;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.StringReader;
import java.util.*;

@RestController
@RequestMapping("/api/imports")
public class ImportController {

    private static final Set<String> REQUIRED_HEADERS = Set.of(
            "id", "name", "address", "municipality",
            "latitude", "longitude", "buildingType", "surfaceM2"
    );

    private final BuildingRepository buildingRepo;
    private final InterventionOptionRepository optionRepo;

    public ImportController(BuildingRepository b, InterventionOptionRepository o) {
        this.buildingRepo = b;
        this.optionRepo = o;
    }

    @PostMapping("/buildings/validate")
    public ResponseEntity<ImportPreview> validateBuildings(@RequestBody CsvPayload payload) {
        List<ImportRow> rows = new ArrayList<>();
        int valid = 0, invalid = 0;

        try {
            CSVParser parser = parseCsv(payload.content());

            if (!parser.getHeaderNames().containsAll(REQUIRED_HEADERS)) {
                return ResponseEntity.badRequest().body(new ImportPreview(0, 0, List.of(
                        new ImportRow(0, "", List.of("Header mancanti. Attesi: " + REQUIRED_HEADERS))
                )));
            }

            for (CSVRecord record : parser) {
                List<String> errors = validateBuildingRecord(record);
                String id = safeGet(record, "id");
                if (errors.isEmpty()) valid++; else invalid++;
                rows.add(new ImportRow((int) record.getRecordNumber(), id, errors));
            }
        } catch (IOException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ImportPreview(0, 0, List.of(
                    new ImportRow(0, "", List.of("CSV non valido: " + ex.getMessage()))
            )));
        }

        return ResponseEntity.ok(new ImportPreview(valid, invalid, rows));
    }

    @PostMapping("/buildings/commit")
    public ResponseEntity<Map<String, Object>> commitBuildings(@RequestBody CsvPayload payload) {
        int inserted = 0, skipped = 0;

        try {
            CSVParser parser = parseCsv(payload.content());
            for (CSVRecord record : parser) {
                List<String> errors = validateBuildingRecord(record);
                if (!errors.isEmpty()) { skipped++; continue; }

                String id = safeGet(record, "id");
                if (buildingRepo.existsById(id)) { skipped++; continue; }

                Building b = new Building(
                        id,
                        safeGet(record, "name"),
                        safeGet(record, "address"),
                        safeGet(record, "municipality"),
                        parseDouble(safeGet(record, "latitude")),
                        parseDouble(safeGet(record, "longitude")),
                        safeGet(record, "buildingType"),
                        parseDouble(safeGet(record, "surfaceM2")),
                        null, null, null,
                        DataProvenance.SYNTHETIC
                );
                buildingRepo.save(b);
                inserted++;
            }
        } catch (IOException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "CSV non valido: " + ex.getMessage(),
                    "inserted", inserted,
                    "skipped", skipped
            ));
        }

        return ResponseEntity.ok(Map.of("inserted", inserted, "skipped", skipped));
    }

    // ---------- helpers ----------

    private CSVParser parseCsv(String content) throws IOException {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Contenuto CSV mancante o vuoto");
        }
        String cleaned = content.startsWith("\uFEFF") ? content.substring(1) : content;
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n");

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .setIgnoreSurroundingSpaces(true)
                .build();

        return CSVParser.parse(new StringReader(cleaned), format);
    }

    private List<String> validateBuildingRecord(CSVRecord record) {
        List<String> errors = new ArrayList<>();
        String id = safeGet(record, "id");
        if (id.isEmpty()) {
            errors.add("ID mancante");
        } else if (buildingRepo.existsById(id)) {
            errors.add("ID già esistente nel catalogo");
        }
        if (safeGet(record, "name").isEmpty()) errors.add("Nome mancante");

        if (tryParseDouble(safeGet(record, "latitude")) == null) errors.add("Latitudine non valida");
        if (tryParseDouble(safeGet(record, "longitude")) == null) errors.add("Longitudine non valida");

        return errors;
    }

    private String safeGet(CSVRecord record, String column) {
        try {
            String v = record.get(column);
            return v == null ? "" : v.trim();
        } catch (Exception e) {
            return "";
        }
    }

    private double parseDouble(String s) {
        Double v = tryParseDouble(s);
        return v == null ? 0.0 : v;
    }

    private Double tryParseDouble(String s) {
        if (s == null || s.isEmpty()) return null;
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            try {
                return Double.parseDouble(s.replace(',', '.'));
            } catch (NumberFormatException e2) {
                return null;
            }
        }
    }

    public record CsvPayload(String content) {}
    public record ImportRow(int rowNumber, String id, List<String> errors) {}
    public record ImportPreview(int valid, int invalid, List<ImportRow> rows) {}
}