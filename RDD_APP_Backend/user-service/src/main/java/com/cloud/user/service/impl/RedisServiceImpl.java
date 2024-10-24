package com.cloud.user.service.impl;

import com.cloud.user.pojo.*;
import com.cloud.user.service.RedisService;
import io.lettuce.core.cluster.api.StatefulRedisClusterConnection;
import io.lettuce.core.cluster.api.sync.RedisAdvancedClusterCommands;
import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisServiceImpl implements RedisService {

    @Autowired
    private StatefulRedisClusterConnection<String, Object> redisClusterConnection;
    RedisAdvancedClusterCommands<String, Object> commands;

    @PostConstruct
    public void init() {
        this.commands = redisClusterConnection.sync();
    }
    
    public <T> void set(String key, T value) {
        commands.setex(key, 8 * 60 * 60, value);
    }

    public void delete(String key) {
        commands.del(key);
    }

    public <T> T get(String key) {
        return (T) commands.get(key);
    }
}
