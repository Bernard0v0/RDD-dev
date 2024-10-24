package com.cloud.rdd.pojo;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;


import java.time.LocalDateTime;
@Data
public class User {
    private String id;
    private String username;
    @JsonIgnore
    private String password;
    private String email;
    private Integer level;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
}
