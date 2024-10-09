package com.cloud.rdd.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Detection {
    private Integer id;
    private String imgSourceUrl;
    private String imgUrl;
    private String latitude;
    private String longitude;
    private Integer defNum;
    private Integer completeNum;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
}
