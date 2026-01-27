package com.ssafy.yaksok.global.llm.service;

public interface LLMService {
    String query(String prompt);
    String query(String prompt, double temperature);
}