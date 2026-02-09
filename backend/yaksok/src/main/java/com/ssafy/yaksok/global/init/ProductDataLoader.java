// package com.ssafy.yaksok.global.init;

// import com.opencsv.CSVReader;
// import com.opencsv.CSVReaderBuilder;
// import com.opencsv.RFC4180ParserBuilder;
// import com.opencsv.exceptions.CsvValidationException;
// import com.ssafy.yaksok.product.entity.Product;
// import com.ssafy.yaksok.product.repository.ProductRepository;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.core.annotation.Order;
// import org.springframework.core.io.ClassPathResource;
// import org.springframework.stereotype.Component;
// import java.io.IOException;
// import java.io.InputStreamReader;
// import java.nio.charset.StandardCharsets;
// import java.util.ArrayList;
// import java.util.List;

// @Slf4j
// @Component
// @Order(1) // Run first before ProductIngredientDataLoader
// @RequiredArgsConstructor
// public class ProductDataLoader implements CommandLineRunner {

// private final ProductRepository productRepository;
// private static final int BATCH_SIZE = 1000;

// @Override
// public void run(String... args) {

// if (productRepository.count() > 9) {
// log.info("Products already loaded. Skipping initialization.");
// return;
// }

// log.info("Loading products from CSV...");
// int totalCount = 0;
// List<Product> batch = new ArrayList<>(BATCH_SIZE);

// try (CSVReader reader = new CSVReaderBuilder(
// new InputStreamReader(new
// ClassPathResource("data/health_food_translated.csv").getInputStream(),
// StandardCharsets.UTF_8))
// .withCSVParser(new RFC4180ParserBuilder().build())
// .build()) {
// String[] line;
// reader.readNext(); // Skip header

// // CSV Columns:
// // 0: PRDLST_NM (제품명)
// // 1: IFTKN_ATNT_MATR_CN (섭취 시 주의사항)
// // 2: PRIMARY_FNCLTY (주된 기능성)
// // 3: NTK_MTHD (섭취 방법)
// // 4: STDR_STND (기준 및 규격) - DB에 컬럼 없음, 저장하지 않음

// while ((line = reader.readNext()) != null) {
// try {
// String prdlstNm = line.length > 0 ? line[0] : null;
// String iftknAtntMatrCn = line.length > 1 ? line[1] : null;
// String primaryFnclty = line.length > 2 ? line[2] : null;
// String ntkMthd = line.length > 3 ? line[3] : null;

// Product product = Product.builder()
// .prdlstNm(prdlstNm)
// .iftknAtntMatrCn(iftknAtntMatrCn)
// .primaryFnclty(primaryFnclty)
// .ntkMthd(ntkMthd)
// .build();

// batch.add(product);
// totalCount++;

// } catch (Exception e) {
// log.error("Failed to parse product line: {}", (Object) line, e);
// continue;
// }

// // Batch save for memory efficiency (moved outside parsing try-catch)
// if (batch.size() >= BATCH_SIZE) {
// try {
// productRepository.saveAll(batch);
// } catch (Exception e) {
// log.error("Failed to save batch at count {}: {}", totalCount,
// e.getMessage());
// }
// batch.clear(); // Always clear batch after save attempt

// if (totalCount % 10000 == 0) {
// log.info("Loaded {} products...", totalCount);
// }
// }
// }

// // Save remaining batch
// if (!batch.isEmpty()) {
// try {
// productRepository.saveAll(batch);
// } catch (Exception e) {
// log.error("Failed to save final batch: {}", e.getMessage());
// }
// }

// log.info("Successfully loaded {} products.", totalCount);

// } catch (IOException | CsvValidationException e) {
// log.error("Failed to load product CSV file", e);
// }
// }
// }
