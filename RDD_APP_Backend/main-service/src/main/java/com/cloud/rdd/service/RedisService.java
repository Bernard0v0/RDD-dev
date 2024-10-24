package com.cloud.rdd.service;


public interface RedisService {
    <T> void set(String key, T value);
    <T> T get(String key);
    void delete(String key);
}
