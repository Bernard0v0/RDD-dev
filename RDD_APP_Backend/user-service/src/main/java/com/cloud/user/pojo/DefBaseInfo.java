package com.cloud.user.pojo;

import lombok.Data;

@Data
public class DefBaseInfo {
    private Integer id;
    private String imgSourceUrl;
    private String imgUrl;
    private String description;
    private Double latitude;
    private Double longitude;
}
