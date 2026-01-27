package com.ssafy.yaksok.disease.controller;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.service.DiseaseService;
import com.ssafy.yaksok.global.handler.GlobalExceptionHandler;
import com.ssafy.yaksok.security.config.SecurityConfig;
import com.ssafy.yaksok.security.filter.JwtAuthenticationFilter;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DiseaseController.class)
@Import({ SecurityConfig.class, GlobalExceptionHandler.class, JwtAuthenticationFilter.class })
@AutoConfigureMockMvc(addFilters = true)
@DisplayName("DiseaseController 통합 연동 테스트 (@WebMvcTest)")
class DiseaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DiseaseService diseaseService;

    @MockBean
    private JwtTokenResolver jwtTokenResolver;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/diseases - 성공: 질병 목록 반환")
    void getDisease_Success() throws Exception {
        // given
        Disease d1 = Disease.builder().id(1L).sickName("감기").build();
        given(diseaseService.findAllDisease()).willReturn(List.of(d1));

        // when & then
        mockMvc.perform(get("/api/v1/diseases"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].sickName").value("감기"));
    }

    @Test
    @DisplayName("GET /api/v1/diseases - 성공: 데이터 없음")
    void getDisease_Empty() throws Exception {
        // given
        given(diseaseService.findAllDisease()).willReturn(Collections.emptyList());

        // when & then
        mockMvc.perform(get("/api/v1/diseases"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    @DisplayName("실패: 서버 내부 오류")
    void getDisease_InternalError() throws Exception {
        // given
        given(diseaseService.findAllDisease()).willThrow(new RuntimeException("DB Error"));

        // when & then
        mockMvc.perform(get("/api/v1/diseases"))
                .andDo(print())
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("COMMON_500"));
    }
}
