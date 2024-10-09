package com.cloud.rdd.mapper;

import com.cloud.rdd.pojo.ImgInfo;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;

@Mapper
public interface ImgMapper {
    @Insert("insert into det (img_source_url,latitude,longitude,detect_flag,delete_flag,created_by,created_time,updated_by,updated_time) values (#{imgSourceUrl},#{latitude},#{longitude},'N','N',#{username},now(),#{username},now())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void createDet(ImgInfo imgInfo);
}
