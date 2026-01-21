package com.ssafy.yaksok.global.init;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@Order(2) // Run after ProductDataLoader, before ProductIngredientDataLoader
@RequiredArgsConstructor
public class IngredientDataLoader implements CommandLineRunner {

    private final IngredientRepository ingredientRepository;

    @Override
    public void run(String... args) {
        if (ingredientRepository.count() > 0) {
            log.info("Ingredients already loaded. Skipping initialization.");
            return;
        }

        log.info("Loading ingredients from CSV...");
        try (CSVReader reader = new CSVReader(new InputStreamReader(
                new ClassPathResource("data/ingredient.csv").getInputStream(), StandardCharsets.UTF_8))) {
            String[] line;
            reader.readNext(); // Skip header

            while ((line = reader.readNext()) != null) {
                // CSV Columns:
                // 0: id
                // 1: product_name (IGNORE)
                // 2: ingredient_name
                // 3: min_intake_value
                // 4: max_intake_value
                // 5: base_unit
                // 6: display_unit
                // 7: created_at (IGNORE)
                // 8: updated_at (IGNORE)

                try {
                    String ingredientName = line[2];

                    // Skip if ingredient with this name already exists
                    if (ingredientRepository.existsByIngredientName(ingredientName)) {
                        log.debug("Skipping duplicate ingredient: {}", ingredientName);
                        continue;
                    }

                    BigDecimal minIntakeValue = parseBigDecimal(line[3]);
                    BigDecimal maxIntakeValue = parseBigDecimal(line[4]);
                    String baseUnit = line[5];
                    String displayUnit = line[6];

                    Ingredient ingredient = Ingredient.builder()
                            .ingredientName(ingredientName)
                            .minIntakeValue(minIntakeValue)
                            .maxIntakeValue(maxIntakeValue)
                            .baseUnit(baseUnit)
                            .displayUnit(displayUnit)
                            .build();

                    ingredientRepository.save(ingredient);

                } catch (NumberFormatException e) {
                    log.error("Failed to parse number in line: {}", (Object) line, e);
                }
            }
            log.info("Successfully loaded ingredients.");

        } catch (IOException | CsvValidationException e) {
            log.error("Failed to load ingredient CSV file", e);
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return new BigDecimal(value);
    }
}
