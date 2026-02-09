//package com.ssafy.yaksok.global.init;
//
//import com.opencsv.CSVReader;
//import com.opencsv.exceptions.CsvValidationException;
//import com.ssafy.yaksok.disease.entity.Disease;
//import com.ssafy.yaksok.disease.repository.DiseaseRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.core.annotation.Order;
//import org.springframework.core.io.ClassPathResource;
//import org.springframework.stereotype.Component;
//
//import java.io.IOException;
//import java.io.InputStreamReader;
//import java.nio.charset.StandardCharsets;
//
//@Slf4j
//@Component
//@Order(4)
//@RequiredArgsConstructor
//public class DiseaseDataLoader implements CommandLineRunner {
//
//    private final DiseaseRepository diseaseRepository;
//
//    @Override
//    public void run(String... args) {
//        if (diseaseRepository.count() > 1) {
//            log.info("Diseases already loaded. Skipping initialization.");
//            return;
//        }
//
//        log.info("Loading diseases from CSV...");
//        try (CSVReader reader = new CSVReader(new InputStreamReader(
//                new ClassPathResource("data/disease.csv").getInputStream(), StandardCharsets.UTF_8))) {
//
//            String[] line;
//            reader.readNext(); // Skip header (sick_name)
//
//            while ((line = reader.readNext()) != null) {
//                if (line.length == 0 || line[0] == null || line[0].trim().isEmpty()) {
//                    continue;
//                }
//
//                String sickName = line[0].trim();
//
//                if (sickName != null && !diseaseRepository.existsBySickName(sickName)) {
//                    Disease disease = Disease.builder()
//                            .sickName(sickName)
//                            .build();
//                    diseaseRepository.save(disease);
//                }
//            }
//            log.info("Successfully loaded diseases.");
//
//        } catch (IOException | CsvValidationException e) {
//            log.error("Failed to load disease CSV file", e);
//        }
//    }
//}
