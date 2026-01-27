package com.ssafy.yaksok.analyze.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 제품 Entity
 */
@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PRDLST_NM")
    private String productName;

    @Column(name = "PRIMARY_FNCLTY", columnDefinition = "TEXT")
    private String primaryFunction;

    @Column(name = "NTK_MTHD", columnDefinition = "TEXT")
    private String intakeMethod;

    @Column(name = "IFTKN_ATNT_MATR_CN", columnDefinition = "TEXT")
    private String caution;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
