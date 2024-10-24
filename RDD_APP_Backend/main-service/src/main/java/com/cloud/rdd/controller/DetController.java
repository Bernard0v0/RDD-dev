package com.cloud.rdd.controller;

import com.cloud.rdd.pojo.Detection;
import com.cloud.rdd.pojo.PageBean;
import com.cloud.rdd.pojo.Result;
import com.cloud.rdd.service.RedisService;
import com.cloud.rdd.service.impl.DetServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
@RestController
@RequestMapping("/api/det")
@Validated
public class DetController {
    @Autowired
    private DetServiceImpl detService;

    @GetMapping("/det_list")
    public Result<PageBean<Detection>> getDetList(Integer pageNum, Integer pageSize,
            @RequestParam(required = false) String defNum, @RequestParam(required = false) String createdTime,
            @RequestParam(required = false) String updatedTime, @RequestParam String type) {
        PageBean<Detection> list = detService.getDetList(pageNum, pageSize, defNum, createdTime, updatedTime, type);
        return Result.success(list);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
       return new ResponseEntity<>(
      HttpStatus.OK);
    }

    @DeleteMapping("/delete")
    public Result deleteDet(@RequestParam Integer id){
        detService.delete(id);
        return Result.success();
    }
    }
