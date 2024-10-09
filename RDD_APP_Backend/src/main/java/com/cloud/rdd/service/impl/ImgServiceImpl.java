package com.cloud.rdd.service.impl;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import com.cloud.rdd.mapper.ImgMapper;
import com.cloud.rdd.pojo.ImgInfo;
import com.cloud.rdd.service.ImgService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;


import java.time.Duration;


@Service
public class ImgServiceImpl implements ImgService {
    @Autowired
    private ImgMapper imgMapper;

    @Autowired
    private S3Presigner presigner;
    public Integer createDet(Double latitude, Double longitude, String imgSourceUrl){
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getTokenAttributes().get("cognito:username").toString();
        ImgInfo detection = new ImgInfo();
        detection.setLatitude(latitude);
        detection.setLongitude(longitude);
        detection.setImgSourceUrl(imgSourceUrl);
        detection.setUsername(username);
        imgMapper.createDet(detection);
        return detection.getId();
    }
    public String generatePresignedUrl(String bucketName, String objectKey){

            PutObjectRequest objectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(10))
                    .putObjectRequest(objectRequest)
                    .build();


            PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);

            return presignedRequest.url().toExternalForm();

    }
}
