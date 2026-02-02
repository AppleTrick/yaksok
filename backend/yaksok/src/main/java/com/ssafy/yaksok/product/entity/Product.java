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

    @Lob
    @Column(name = "PRIMARY_FNCLTY", columnDefinition = "TEXT")
    private String primaryFnclty;

    @Lob
    @Column(name = "NTK_MTHD", columnDefinition = "TEXT")
    private String ntkMthd;

    @Lob
    @Column(name = "IFTKN_ATNT_MATR_CN", columnDefinition = "TEXT")
    private String iftknAtntMatrCn;

    /**
     * Product가 가진 성분 목록
     * ProductIngredient와 1:N 관계
     */
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductIngredient> productIngredients = new ArrayList<>();

    @Builder
    public Product(Long id, String prdlstNm, String primaryFnclty, String ntkMthd, String iftknAtntMatrCn) {
        this.id = id;
        this.prdlstNm = prdlstNm;
        this.primaryFnclty = primaryFnclty;
        this.ntkMthd = ntkMthd;
        this.iftknAtntMatrCn = iftknAtntMatrCn;
    }
}