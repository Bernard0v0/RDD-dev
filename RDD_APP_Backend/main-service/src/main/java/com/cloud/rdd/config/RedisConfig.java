package com.cloud.rdd.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.lettuce.core.RedisURI;
import io.lettuce.core.cluster.RedisClusterClient;
import io.lettuce.core.cluster.api.StatefulRedisClusterConnection;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.resource.DefaultClientResources;
import io.lettuce.core.resource.Delay;
import io.lettuce.core.resource.DirContextDnsResolver;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class RedisConfig {
    @Bean
    public RedisClusterClient redisClusterClient() {
        String clusterConfigurationEndpoint = "elastic_cache_url";
        RedisURI redisUriCluster = RedisURI.Builder.redis(clusterConfigurationEndpoint)
                .withPort(6379)
                .withSsl(true)
                .build();
        ClientResources clientResources = DefaultClientResources.builder().reconnectDelay(
                Delay.fullJitter(
                        Duration.ofMillis(100),
                        Duration.ofSeconds(10),
                        100, TimeUnit.MILLISECONDS))
                .dnsResolver(new DirContextDnsResolver())
                .build();
        return RedisClusterClient.create(clientResources, redisUriCluster);
    }

    @Bean
    public StatefulRedisClusterConnection<String, Object> redisClusterConnection(
            RedisClusterClient redisClusterClient) {
        RedisCodec<String, Object> codec = new JacksonRedisCodec();
        return redisClusterClient.connect(codec);
    }

    // Custom RedisCodec using Jackson for serialization/deserialization
    public static class JacksonRedisCodec implements RedisCodec<String, Object> {

        private final ObjectMapper objectMapper;

        public JacksonRedisCodec() {
            this.objectMapper = new ObjectMapper();
            this.objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
            this.objectMapper.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
            this.objectMapper.registerModule(new JavaTimeModule());
            this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        }

        // Serialize key (String -> ByteBuffer)
        @Override
        public ByteBuffer encodeKey(String key) {
            return ByteBuffer.wrap(key.getBytes());
        }

        // Deserialize key (ByteBuffer -> String)
        @Override
        public String decodeKey(ByteBuffer bytes) {
            byte[] byteArray = new byte[bytes.remaining()];
            bytes.get(byteArray);
            return new String(byteArray);
        }

        // Serialize value (Object -> ByteBuffer)
        @Override
        public ByteBuffer encodeValue(Object value) {
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(value);
                return ByteBuffer.wrap(bytes);
            } catch (Exception e) {
                throw new RuntimeException("Could not serialize value", e);
            }
        }

        // Deserialize value (ByteBuffer -> Object)
        @Override
        public Object decodeValue(ByteBuffer bytes) {
            byte[] byteArray = new byte[bytes.remaining()];
            bytes.get(byteArray);
            try {
                return objectMapper.readValue(byteArray, Object.class);
            } catch (Exception e) {
                throw new RuntimeException("Could not deserialize value", e);
            }
        }

    }
}
