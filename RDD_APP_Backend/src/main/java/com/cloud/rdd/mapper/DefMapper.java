package com.cloud.rdd.mapper;

import com.cloud.rdd.pojo.Defect;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface DefMapper {
    @Select("select def.id from def inner join det on def.img_id = det.id where def.img_id = #{imgId} and det.delete_flag = 'N' and def.delete_flag='N'")
    List<Integer> getDetail(Integer imgId);

    @Update("update def set stat = #{stat}, updated_by=#{username},updated_time= now() where id = #{defId}")
    void updateStat(Integer defId, Integer stat, String username);

    @Update("update def set type = #{type}, updated_by=#{username},updated_time= now() where id = #{defId}")
    void updateType(Integer defId, Integer type, String username);

    @Update("update def set delete_flag = 'Y', updated_by=#{username},updated_time= now() where id = #{defId}")
    void deleteDef(Integer defId, String username);
    @Update("update det set description = #{description} , updated_by=#{username},updated_time= now() where id = #{imgId}")
    void updateDesc(Integer imgId, String description, String username);

    @Select("select id, img_id, img_url, coord_left, coord_top, coord_right ,coord_bottom, conf, type, stat, created_by,created_time,updated_by,updated_time from def  WHERE delete_flag = 'N' and id=#{defId}")
    Defect getDefById(Integer defId);

    List<Integer> getDefList(String defNum, String createdTime, String updatedTime, String type);
}
