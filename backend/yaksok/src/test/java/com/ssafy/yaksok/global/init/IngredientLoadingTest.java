package com.ssafy.yaksok.global.init;

import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("local") // Use the local profile to connect to MySQL
class IngredientLoadingTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Test
    void ingredientsAreLoadedOnStartup() {
        long count = ingredientRepository.count();
        assertThat(count).isGreaterThan(0);
        System.out.println("VERIFICATION: Loaded " + count + " ingredients.");
    }
}
