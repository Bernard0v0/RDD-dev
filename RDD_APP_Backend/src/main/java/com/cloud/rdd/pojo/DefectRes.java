package com.cloud.rdd.pojo;

import lombok.Data;

import java.util.List;
@Data
public class DefectRes {
    private DefBaseInfo defBaseInfo;
    private List<Defect> defects;
}
