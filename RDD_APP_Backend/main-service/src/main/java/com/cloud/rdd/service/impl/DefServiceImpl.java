package com.cloud.rdd.service.impl;

import com.cloud.rdd.mapper.DefMapper;
import com.cloud.rdd.mapper.DetMapper;
import com.cloud.rdd.pojo.DefBaseInfo;
import com.cloud.rdd.pojo.Defect;
import com.cloud.rdd.pojo.DefectRes;
import com.cloud.rdd.pojo.PageBean;
import com.cloud.rdd.service.DefService;
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
public class DefServiceImpl implements DefService {
    @Autowired
    private DefMapper defMapper;
    @Autowired
    private DetMapper detMapper;
    @Autowired
    private RedisService redisService;

    public DefectRes getDetail(Integer imgId){
        DefectRes defectRes = redisService.get("detail:" + imgId);
        if(defectRes==null){
            DefectRes res = new DefectRes();
            List<Defect> defList = new ArrayList<>();
            List<Integer> defectListId = defMapper.getDetail(imgId);
            DefBaseInfo info = detMapper.getInfoById(imgId);
            for (Integer defectId : defectListId) {
                Defect def = redisService.get("defect:id:" + defectId);
                if (def == null) {
                    def = defMapper.getDefById(defectId);
                    redisService.set("defect:id:" + defectId, def);
                }
                defList.add(def);
            }
            res.setDefects(defList);
            res.setDefBaseInfo(info);
            redisService.set("detail:" + imgId, res);
            return res;
        }
       return defectRes;
   }
   public void updateStat(Integer imgId, Integer defId, Integer stat){
       JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
       String username = auth.getTokenAttributes().get("cognito:username").toString();
        defMapper.updateStat(defId,stat,username);
        detMapper.updateTime(username,imgId);
        redisService.delete("defect:id:" + defId);
        redisService.delete("detail:" + imgId);
        redisService.delete("detection:id:" + imgId);

   }
   public void updateType(Integer imgId, Integer defId, Integer type){
       JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
       String username = auth.getTokenAttributes().get("cognito:username").toString();
       defMapper.updateType(defId,type,username);
       detMapper.updateTime(username,imgId);
   }
   public boolean deleteDef(Integer defId, Integer imgId){
       JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
       String username = auth.getTokenAttributes().get("cognito:username").toString();
       defMapper.deleteDef(defId,username);
       detMapper.updateDefNum(imgId,username);
       if (defMapper.getDetail(imgId)==null){
           detMapper.updateUrl(imgId);
           return true;
       }
       return false;
   }
    public void updateDesc(Integer imgId, String description){
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getTokenAttributes().get("cognito:username").toString();
        defMapper.updateDesc(imgId,description,username);
        redisService.delete("detail:" + imgId);
    }
    public PageBean<Defect> getDefList(Integer pageNum, Integer pageSize, String defNum, String createdTime, String updatedTime, String type) {
        PageHelper.startPage(pageNum, pageSize);
        List<Integer> defIdList = defMapper.getDefList(defNum, createdTime, updatedTime, type);
        Page<Integer> p = (Page<Integer>) defIdList;
        List<Defect> defList = new ArrayList<>();
        for (Integer id : p.getResult()) {
            Defect def = redisService.get("defect:id:" + id);
            if (def == null) {
                def = defMapper.getDefById(id);
                redisService.set("defect:id:" + id, def);
            }
            defList.add(def);
        }
        PageBean<Defect> pageBean = new PageBean<>();
        pageBean.setTotal(p.getTotal());
        pageBean.setItems(defList);
        return pageBean;
    }

}

