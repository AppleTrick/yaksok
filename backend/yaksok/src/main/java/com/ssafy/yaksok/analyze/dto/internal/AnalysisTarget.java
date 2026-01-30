package com.ssafy.yaksok.analyze.dto.internal;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.response.SupplementAnalysisResponse;
import com.ssafy.yaksok.product.entity.Product;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class AnalysisTarget {
    private final Product product;
    private final String ocrName;
    private final FastApiAnalysisResult.RawAnalysisResult rawResult;
    private List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients;

    public String getName() {
        return product != null ? product.getPrdlstNm() : (ocrName != null ? ocrName : "알 수 없는 제품");
    }
}
