package com.ssafy.yaksok.product.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PRDLST_NM")
    private String prdlstNm;

    @Column(name = "PRIMARY_FNCLTY", columnDefinition = "TEXT")
    private String primaryFnclty;

    @Column(name = "NTK_MTHD", columnDefinition = "TEXT")
    private String ntkMthd;

    @Column(name = "IFTKN_ATNT_MATR_CN", columnDefinition = "TEXT")
    private String iftknAtntMatrCn;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductIngredient> productIngredients = new ArrayList<>();

    @Builder
    public Product(String prdlstNm, String primaryFnclty, String ntkMthd, String iftknAtntMatrCn) {
        this.prdlstNm = prdlstNm;
        this.primaryFnclty = primaryFnclty;
        this.ntkMthd = ntkMthd;
        this.iftknAtntMatrCn = iftknAtntMatrCn;
    }

    public String getName() {
        return this.prdlstNm;
    }

    // 편의 메소드: 섭취 방법
    public String getIntakeMethod() {
        return this.ntkMthd;
    }

    // 편의 메소드: 주의사항
    public String getPrecautions() {
        return this.iftknAtntMatrCn;
    }

    // 편의 메소드: 주요 기능
    public String getPrimaryFunction() {
        return this.primaryFnclty;
    }
}