package com.cloud.rdd.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;


@Data
public class Defect {
    private Integer id;
    private Integer imgId;
    private String imgUrl;
    private Double coordLeft;
    private Double coordTop;
    private Double coordRight;
    private Double coordBottom;
    private Double conf;
    private Integer type;
    private Integer stat;
    private String createdBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    private String updatedBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;

}

