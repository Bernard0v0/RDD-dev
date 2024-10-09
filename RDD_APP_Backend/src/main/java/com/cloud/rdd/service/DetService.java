package com.cloud.rdd.service;

import com.cloud.rdd.pojo.Detection;
import com.cloud.rdd.pojo.PageBean;

public interface DetService {
    
    PageBean<Detection> getDetList(Integer pageNum, Integer pageSize, String defNum, String createdTime, String updatedTime, String type);

    void delete(Integer id);
}
