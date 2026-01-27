package com.ssafy.yaksok.service.impl;

import com.ssafy.yaksok.analyze.domain.dto.IngredientOverdoseResult;
import com.ssafy.yaksok.analyze.domain.dto.IngredientSummary;
import com.ssafy.yaksok.analyze.domain.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.analyze.domain.dto.SimulationProductRequest;
import com.ssafy.yaksok.analyze.repository.UserProductRepository;
import com.ssafy.yaksok.analyze.service.impl.OverdoseCheckServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * OverdoseCheckService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
class OverdoseCheckServiceImplTest {

        @Mock
        private UserProductRepository userProductRepository;

        @InjectMocks
        private OverdoseCheckServiceImpl overdoseCheckService;

        private Long userId;

        @BeforeEach
        void setUp() {
                userId = 1L;
        }

        @Test
        @DisplayName("과복용 성분이 없는 경우 빈 경고 목록 반환")
        void checkOverdose_NoOverdose_ReturnsEmptyWarnings() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민C")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("2000"))
                                                .minIntakeValue(new BigDecimal("100"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getOverdoseCount()).isEqualTo(0);
                assertThat(response.getResults()).hasSize(1);
                assertThat(response.getResults().get(0).isOverdose()).isFalse();
        }

        @Test
        @DisplayName("단일 성분 과복용 시 해당 성분 경고 반환")
        void checkOverdose_SingleOverdose_ReturnsSingleWarning() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("1500"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .minIntakeValue(new BigDecimal("300"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isTrue();
                assertThat(response.getOverdoseCount()).isEqualTo(1);
                assertThat(response.getResults()).hasSize(1);

                IngredientOverdoseResult result = response.getResults().get(0);
                assertThat(result.getIngredientName()).isEqualTo("비타민A");
                assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1500"));
                assertThat(result.getMaxIntakeValue()).isEqualByComparingTo(new BigDecimal("1000"));
                assertThat(result.isOverdose()).isTrue();
        }

        @Test
        @DisplayName("다중 성분 과복용 시 모든 초과 성분 경고 반환")
        void checkOverdose_MultipleOverdose_ReturnsMultipleWarnings() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("1500"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .build(),
                                IngredientSummary.builder()
                                                .ingredientId(2L)
                                                .ingredientName("철분")
                                                .totalAmount(new BigDecimal("60"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("45"))
                                                .build(),
                                IngredientSummary.builder()
                                                .ingredientId(3L)
                                                .ingredientName("비타민C")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("2000"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isTrue();
                assertThat(response.getOverdoseCount()).isEqualTo(2);
                assertThat(response.getResults()).hasSize(3);

                List<IngredientOverdoseResult> overdoseResults = response.getResults().stream()
                                .filter(IngredientOverdoseResult::isOverdose)
                                .toList();
                assertThat(overdoseResults)
                                .extracting(IngredientOverdoseResult::getIngredientName)
                                .containsExactlyInAnyOrder("비타민A", "철분");
        }

        @Test
        @DisplayName("max_intake_value가 NULL인 성분은 과복용에서 제외")
        void checkOverdose_NullMaxValue_ExcludedFromOverdose() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("프로바이오틱스")
                                                .totalAmount(new BigDecimal("10000000000"))
                                                .unit("CFU")
                                                .maxIntakeValue(null)
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getResults()).hasSize(1);
                assertThat(response.getResults().get(0).isOverdose()).isFalse();
        }

        @Test
        @DisplayName("복용 제품이 없는 사용자는 빈 결과 반환")
        void checkOverdose_NoProducts_ReturnsEmptyResult() {
                // given
                when(userProductRepository.findIngredientSummaryByUserId(userId))
                                .thenReturn(Collections.emptyList());

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getOverdoseCount()).isEqualTo(0);
                assertThat(response.getResults()).isEmpty();
        }

        @Test
        @DisplayName("정확히 최대치와 같은 경우 과복용 아님")
        void checkOverdose_ExactlyAtMax_NotOverdose() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민D")
                                                .totalAmount(new BigDecimal("100"))
                                                .unit("㎍")
                                                .maxIntakeValue(new BigDecimal("100"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getResults()).hasSize(1);
                assertThat(response.getResults().get(0).isOverdose()).isFalse();
        }

        @Test
        @DisplayName("totalAmount가 NULL인 성분은 과복용에서 제외")
        void checkOverdose_NullTotalAmount_ExcludedFromOverdose() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민E")
                                                .totalAmount(null)
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("300"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getResults()).hasSize(1);
                assertThat(response.getResults().get(0).isOverdose()).isFalse();
        }

        @Test
        @DisplayName("totalIngredientCount가 정확히 반환되는지 확인")
        void checkOverdose_TotalIngredientCount_ReturnsCorrectCount() {
                // given
                List<IngredientSummary> summaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .build(),
                                IngredientSummary.builder()
                                                .ingredientId(2L)
                                                .ingredientName("비타민C")
                                                .totalAmount(new BigDecimal("200"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("2000"))
                                                .build(),
                                IngredientSummary.builder()
                                                .ingredientId(3L)
                                                .ingredientName("비타민D")
                                                .totalAmount(new BigDecimal("50"))
                                                .unit("㎍")
                                                .maxIntakeValue(new BigDecimal("100"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(summaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);

                // then
                assertThat(response.getTotalIngredientCount()).isEqualTo(3);
                assertThat(response.getOverdoseCount()).isEqualTo(0);
                assertThat(response.getResults()).hasSize(3);
        }

        @Test
        @DisplayName("userId가 응답에 정확히 포함되는지 확인")
        void checkOverdose_UserId_ReturnedInResponse() {
                // given
                Long testUserId = 999L;
                when(userProductRepository.findIngredientSummaryByUserId(testUserId))
                                .thenReturn(Collections.emptyList());

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdose(testUserId);

                // then
                assertThat(response.getUserId()).isEqualTo(testUserId);
        }

        // =============================================
        // 시뮬레이션 테스트
        // =============================================

        @Test
        @DisplayName("시뮬레이션 - 기존 성분과 추가 제품 성분 합산")
        void checkOverdoseWithSimulation_MergesExistingAndAdditional() {
                // given: DB에 비타민A 600
                List<IngredientSummary> dbSummaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("600"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(dbSummaries);

                // 추가 제품: 비타민A 500
                Long productId = 10L;
                Integer dailyDose = 1;
                List<IngredientSummary> productSummaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .build());
                when(userProductRepository.findIngredientsByProductId(productId, dailyDose))
                                .thenReturn(productSummaries);

                List<SimulationProductRequest> additionalProducts = Arrays.asList(
                                new SimulationProductRequest(productId, dailyDose));

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithSimulation(
                                userId, additionalProducts);

                // then: 600 + 500 = 1100 > 1000 → 과복용!
                assertThat(response.isHasAnyOverdose()).isTrue();
                assertThat(response.getOverdoseCount()).isEqualTo(1);

                IngredientOverdoseResult result = response.getResults().get(0);
                assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1100"));
                assertThat(result.isOverdose()).isTrue();
        }

        @Test
        @DisplayName("시뮬레이션 - 새 성분이 추가되는 경우")
        void checkOverdoseWithSimulation_AddsNewIngredient() {
                // given: DB에 비타민A
                List<IngredientSummary> dbSummaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민A")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("㎍RE")
                                                .maxIntakeValue(new BigDecimal("1000"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(dbSummaries);

                // 추가 제품: EPA (새 성분)
                Long productId = 10L;
                Integer dailyDose = 2;
                List<IngredientSummary> productSummaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(2L)
                                                .ingredientName("EPA")
                                                .totalAmount(new BigDecimal("2000"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("3000"))
                                                .build());
                when(userProductRepository.findIngredientsByProductId(productId, dailyDose))
                                .thenReturn(productSummaries);

                List<SimulationProductRequest> additionalProducts = Arrays.asList(
                                new SimulationProductRequest(productId, dailyDose));

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithSimulation(
                                userId, additionalProducts);

                // then: 기존 1개 + 새로운 1개 = 총 2개
                assertThat(response.getTotalIngredientCount()).isEqualTo(2);
                assertThat(response.isHasAnyOverdose()).isFalse();
        }

        @Test
        @DisplayName("시뮬레이션 - 추가 제품이 없으면 기존 결과와 동일")
        void checkOverdoseWithSimulation_EmptyAdditional_SameAsCheckOverdose() {
                // given
                List<IngredientSummary> dbSummaries = Arrays.asList(
                                IngredientSummary.builder()
                                                .ingredientId(1L)
                                                .ingredientName("비타민C")
                                                .totalAmount(new BigDecimal("500"))
                                                .unit("mg")
                                                .maxIntakeValue(new BigDecimal("2000"))
                                                .build());
                when(userProductRepository.findIngredientSummaryByUserId(userId)).thenReturn(dbSummaries);

                // when
                OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithSimulation(
                                userId, Collections.emptyList());

                // then
                assertThat(response.isHasAnyOverdose()).isFalse();
                assertThat(response.getTotalIngredientCount()).isEqualTo(1);
        }
}
