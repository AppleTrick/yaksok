package com.ssafy.yaksok.disease.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "disease")
public class Disease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sick_name", unique = true)
    private String sickName;

    @Builder
    public Disease(Long id, String sickName) {
        this.id = id;
        this.sickName = sickName;
    }
}
