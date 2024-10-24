package com.cloud.rdd.service;

import com.cloud.rdd.pojo.Defect;
import com.cloud.rdd.pojo.DefectRes;
import com.cloud.rdd.pojo.PageBean;


public interface DefService {
    DefectRes getDetail(Integer imgId);

    void updateStat(Integer imgId, Integer defId, Integer stat);

    void updateType(Integer imgId, Integer defId, Integer type);

   boolean deleteDef(Integer defId, Integer imgId);

    void updateDesc(Integer imgId,String description);

    PageBean<Defect> getDefList(Integer pageNum, Integer pageSize, String defNum, String createdTime, String updatedTime, String type);
}
