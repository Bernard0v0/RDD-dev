package com.cloud.rdd.controller;
import com.cloud.rdd.pojo.Result;
import com.cloud.rdd.service.ImgService;
import com.cloud.rdd.service.RedisService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/img")
@Validated
public class ImgController {
    @Autowired
    private ImgService imgService;


    private final String baseurl = "xxx";
    // https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presign.html
    @GetMapping("/generate-presigned-url")
    public Result<String> generatePresignedUrl(@RequestParam String bucketName, @RequestParam String objectKey) {
        return Result.success(imgService.generatePresignedUrl(bucketName, objectKey));
    }

    @PostMapping("/update")
    public Result receiveImg(Double latitude, Double longitude, String imgSourceUrl) {
        Integer id = imgService.createDet(latitude,longitude,imgSourceUrl);
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("img_source_url", imgSourceUrl);

        try {
            WebClient webClient = WebClient.create(baseurl);
            String response = webClient.post()
                    .uri("/ml/img_detection")
                    .header("Content-Type", "application/json")
                    .bodyValue(data)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> map = mapper.readValue(response, Map.class);
            int code = (int) map.get("code");
            if (code==0){
                return Result.success();}
            else{
                    return Result.error("No defects detected");}
        } catch (Exception e) {
            e.printStackTrace();
            try { // trying to resend the request
                WebClient webClient = WebClient.create(baseurl);
                String response = webClient.post()
                        .uri("/ml/img_detection")
                        .header("Content-Type", "application/json")
                        .bodyValue(data)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> map = mapper.readValue(response, Map.class);
                int code = (int) map.get("code");
                if (code == 0) {
                    return Result.success();
                } else {
                    return Result.error("No defects detected");
                } 
            } catch (Exception err) {
                err.printStackTrace();
                return Result.error("Connection lost"); //still lost connection after retry, then report error to the frontend
            }
            
        }
    }
}
