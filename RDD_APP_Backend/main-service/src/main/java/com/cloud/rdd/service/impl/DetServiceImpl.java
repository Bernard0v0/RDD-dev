package com.cloud.rdd.service.impl;

import com.cloud.rdd.mapper.DetMapper;
import com.cloud.rdd.pojo.Detection;
import com.cloud.rdd.pojo.PageBean;
import com.cloud.rdd.service.DetService;
import com.cloud.rdd.service.RedisService;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DetServiceImpl implements DetService {
    @Autowired
    private DetMapper detMapper;
    @Autowired
    private RedisService redisService;

    public PageBean<Detection> getDetList(Integer pageNum, Integer pageSize, String defNum, String createdTime, String updatedTime, String type){
        PageHelper.startPage(pageNum,pageSize);
        List<Integer> as = detMapper.getDetList(defNum,createdTime,updatedTime,type);
        Page<Integer> p = (Page<Integer>) as;
        List<Detection> detList = new ArrayList<>();
        for (Integer id : p.getResult()) {
            Detection det = redisService.get("detection:id:"+id);
            if(det == null){
                det = detMapper.getDetById(id);
                redisService.set("detection:id:"+id,det);
            }
            detList.add(det);
        }
        PageBean<Detection> res = new PageBean<>();
        res.setTotal(p.getTotal());
        res.setItems(detList);
        return res;
    }
    public void delete(Integer id){
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getTokenAttributes().get("cognito:username").toString();
        detMapper.deleteDet(id,username);
        detMapper.deleteDef(id,username);
        redisService.delete("detection:id:" + id);
        redisService.delete("detail:" + id);
    }
}
