package com.cloud.rdd.mapper;

import com.cloud.rdd.pojo.DefBaseInfo;
import com.cloud.rdd.pojo.Detection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface DetMapper {

    List<Integer> getDetList(String defNum, String createdTime, String updatedTime, String type);

    @Select("SELECT id, img_source_url, img_url, latitude, longitude, def_num, created_time, updated_time, " +
            "(SELECT COUNT(*) FROM def WHERE def.img_id = det.id AND (def.stat = 2 OR def.stat = 3)) AS complete_num " +
            "FROM det WHERE id = #{id}")
    Detection getDetById(Integer id);

    @Select("select id,img_source_url,img_url,description,latitude,longitude from det where id=#{id}")
    DefBaseInfo getInfoById(Integer id);
    
    void deleteDet(Integer id, String username);

    void deleteDef(Integer id, String username);

    @Update("update det set updated_by=#{username},updated_time= now() where id = #{imgId} ")
    void updateTime(String username, Integer imgId);

    @Update("update det set def_num=def_num-1, updated_by=#{username},updated_time =now() where id = #{imgId}")
    void updateDefNum(Integer imgId,String username);
    
    @Update("update det set img_url = img_source_url where id = #{imgId}")
    void updateUrl(Integer imgId);
}
