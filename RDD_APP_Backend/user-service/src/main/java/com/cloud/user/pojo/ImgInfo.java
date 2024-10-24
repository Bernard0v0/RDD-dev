package com.cloud.user.pojo;

import lombok.Data;

@Data
public class ImgInfo {
    private Integer id;
    private String imgSourceUrl;
    private String imgUrl;
    private Double latitude;
    private Double longitude;
    private String username;
}
