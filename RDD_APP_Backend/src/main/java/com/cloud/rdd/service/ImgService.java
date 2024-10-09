package com.cloud.rdd.service;

public interface ImgService {
    Integer createDet(Double latitude, Double longitude, String imgSourceUrl);
    
    String generatePresignedUrl(String bucketName, String objectKey);
}
