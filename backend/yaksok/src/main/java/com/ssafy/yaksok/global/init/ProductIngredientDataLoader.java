//package com.ssafy.yaksok.global.init;
//
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.ssafy.yaksok.ingredient.entity.Ingredient;
//import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
//import com.ssafy.yaksok.product.entity.Product;
//import com.ssafy.yaksok.product.entity.ProductIngredient;
//import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
//import com.ssafy.yaksok.product.repository.ProductRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.core.annotation.Order;
//import org.springframework.core.io.ClassPathResource;
//import org.springframework.stereotype.Component;
//
//import java.io.IOException;
//import java.io.InputStream;
//import java.math.BigDecimal;
//import java.util.*;
//
//@Slf4j
//@Component
//@Order(3) // Run after ProductDataLoader and IngredientDataLoader
//@RequiredArgsConstructor
//public class ProductIngredientDataLoader implements CommandLineRunner {
//
//    private final ProductRepository productRepository;
//    private final IngredientRepository ingredientRepository;
//    private final ProductIngredientRepository productIngredientRepository;
//    private final ObjectMapper objectMapper;
//
//    private static final int BATCH_SIZE = 1000;
//
//    @Override
//    public void run(String... args) {
//        if (productIngredientRepository.count() > 0) {
//            log.info("Product-Ingredient mappings already loaded. Skipping initialization.");
//            return;
//        }
//
//        log.info("Loading product-ingredient mappings from JSON...");
//        int totalCount = 0;
//        int skippedProducts = 0;
//        int skippedIngredients = 0;
//        int skippedInvalidValue = 0;
//        int skippedNoUnit = 0;
//        int skippedDuplicates = 0;
//        List<ProductIngredient> batch = new ArrayList<>(BATCH_SIZE);
//        Set<String> processedPairs = new HashSet<>(); // Track product-ingredient pairs to prevent duplicates
//
//        // Pre-load all products into cache for faster lookup (avoid N+1 queries)
//        log.info("Pre-loading products into cache...");
//        Map<String, Product> productCache = new HashMap<>();
//        productRepository.findAll().forEach(p -> productCache.put(p.getPrdlstNm(), p));
//        log.info("Loaded {} products into cache", productCache.size());
//
//        // Pre-load all ingredients into cache for faster lookup
//        log.info("Pre-loading ingredients into cache...");
//        Map<String, Ingredient> ingredientCache = new HashMap<>();
//        ingredientRepository.findAll().forEach(i -> ingredientCache.put(i.getIngredientName(), i));
//        log.info("Loaded {} ingredients into cache", ingredientCache.size());
//
//        try (InputStream inputStream = new ClassPathResource("data/parsed_ingredients.json").getInputStream()) {
//            List<Map<String, Object>> products = objectMapper.readValue(inputStream, new TypeReference<>() {
//            });
//
//            for (Map<String, Object> productData : products) {
//                String productName = (String) productData.get("product_name");
//                if (productName == null)
//                    continue;
//
//                // Find product by name from cache
//                Product product = productCache.get(productName);
//                if (product == null) {
//                    skippedProducts++;
//                    continue;
//                }
//
//                @SuppressWarnings("unchecked")
//                List<Map<String, Object>> parsedIngredients = (List<Map<String, Object>>) productData
//                        .get("parsed_ingredients");
//                if (parsedIngredients == null)
//                    continue;
//
//                for (Map<String, Object> ingredientData : parsedIngredients) {
//                    String ingredientName = (String) ingredientData.get("name");
//                    String value = (String) ingredientData.get("value");
//                    String valueUnit = (String) ingredientData.get("value_unit");
//                    String nameUnit = (String) ingredientData.get("name_unit");
//
//                    if (ingredientName == null)
//                        continue;
//
//                    // Find ingredient by name from cache
//                    Ingredient ingredient = ingredientCache.get(ingredientName);
//                    if (ingredient == null) {
//                        skippedIngredients++;
//                        continue;
//                    }
//
//                    // Validate value is numeric
//                    BigDecimal amount;
//                    try {
//                        if (value == null || value.trim().isEmpty()) {
//                            skippedInvalidValue++;
//                            continue;
//                        }
//                        // Remove commas from numbers like "3,000"
//                        String cleanValue = value.replace(",", "").trim();
//                        amount = new BigDecimal(cleanValue);
//                    } catch (NumberFormatException e) {
//                        skippedInvalidValue++;
//                        continue;
//                    }
//
//                    // Determine unit: value_unit first, then name_unit
//                    String unit = (valueUnit != null && !valueUnit.trim().isEmpty()) ? valueUnit : nameUnit;
//                    if (unit == null || unit.trim().isEmpty()) {
//                        skippedNoUnit++;
//                        continue;
//                    }
//
//                    // Check for duplicate product-ingredient pair
//                    String pairKey = product.getId() + "-" + ingredient.getId();
//                    if (processedPairs.contains(pairKey)) {
//                        skippedDuplicates++;
//                        continue;
//                    }
//                    processedPairs.add(pairKey);
//
//                    ProductIngredient pi = ProductIngredient.builder()
//                            .product(product)
//                            .ingredient(ingredient)
//                            .ingredientAmount(amount)
//                            .amountUnit(unit.trim())
//                            .build();
//
//                    batch.add(pi);
//                    totalCount++;
//
//                    // Batch save
//                    if (batch.size() >= BATCH_SIZE) {
//                        try {
//                            productIngredientRepository.saveAll(batch);
//                        } catch (Exception e) {
//                            log.error("Failed to save batch at count {}: {}", totalCount, e.getMessage());
//                        }
//                        batch.clear();
//
//                        if (totalCount % 10000 == 0) {
//                            log.info("Loaded {} product-ingredient mappings...", totalCount);
//                        }
//                    }
//                }
//            }
//
//            // Save remaining batch
//            if (!batch.isEmpty()) {
//                try {
//                    productIngredientRepository.saveAll(batch);
//                } catch (Exception e) {
//                    log.error("Failed to save final batch: {}", e.getMessage());
//                }
//            }
//
//            log.info("Successfully loaded {} product-ingredient mappings.", totalCount);
//            log.info(
//                    "Skipped: {} products not found, {} ingredients not found, {} invalid values, {} no unit, {} duplicates",
//                    skippedProducts, skippedIngredients, skippedInvalidValue, skippedNoUnit, skippedDuplicates);
//
//        } catch (IOException e) {
//            log.error("Failed to load parsed_ingredients.json", e);
//        }
//    }
//}
