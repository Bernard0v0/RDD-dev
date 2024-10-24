package com.cloud.user.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsConfig {

        @Value("${aws.accessKeyId}")
        private String accessKeyId;

        @Value("${aws.secretAccessKey}")
        private String secretAccessKey;

        @Value("${aws.sessionToken}")
        private String sessionToken;

        @Value("${aws.region}")
        private String region;


        @Bean
        public CognitoIdentityProviderClient cognitoIdentityProviderClient() {
                AwsSessionCredentials sessionCredentials = AwsSessionCredentials.create(
                                accessKeyId,
                                secretAccessKey,
                                sessionToken);

                return CognitoIdentityProviderClient.builder()
                                .credentialsProvider(StaticCredentialsProvider.create(sessionCredentials))
                                .region(Region.of(region))
                                .build();
        }

}