package com.cloud.rdd.controller;

import com.cloud.rdd.pojo.Result;
import com.cloud.rdd.pojo.User;
import com.cloud.rdd.service.RedisService;
import com.mysql.cj.x.protobuf.MysqlxDatatypes.Object;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/user")
@Validated
public class UserController {
    @Autowired
    private CognitoIdentityProviderClient cognitoClient;
    @Autowired
    private RedisService redisService;

    private static final String USER_POOL_ID = "ap-southeast-2_36dt8R11q";

    @PostMapping("/token")
    public Result register(String code) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", "xxx");
        body.add("client_secret", "xxx");
        body.add("redirect_uri", "xxx");
        body.add("code", code);
        body.add("scope", "openid profile email aws.cognito.signin.user.admin");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        String tokenUrl = "xxx";
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        Map<String, String> resMap = new HashMap<String, String>();
        resMap.put("access_token", response.getBody().get("access_token").toString());
        resMap.put("token", response.getBody().get("id_token").toString());
        return Result.success(resMap);
    }

    @PostMapping("/create_account")
    public Result createAccount(User user) {
        List<AttributeType> attributeList = new ArrayList<>();
        AttributeType email = AttributeType.builder()
                .name("email")
                .value(user.getEmail())
                .build();
        AttributeType level = AttributeType.builder()
                .name("custom:Level")
                .value(user.getLevel().toString())
                .build();
        attributeList.add(email);
        attributeList.add(level);
        AdminCreateUserRequest req = AdminCreateUserRequest.builder()
                .userPoolId(USER_POOL_ID)
                .username(user.getUsername())
                .temporaryPassword(user.getPassword())
                .userAttributes(attributeList)
                .desiredDeliveryMediums(DeliveryMediumType.valueOf("EMAIL"))
                .build();
        try {
            AdminCreateUserResponse response = cognitoClient.adminCreateUser(req);
            redisService.delete("userlist");
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }

    }

    @GetMapping("/user_list")
    public Result<List<User>> getUserList() {
        List<User> res = redisService.get("userlist");
        if (res == null) {
            List<User> userlist = new ArrayList<>();
            ListUsersRequest request = ListUsersRequest.builder()
                    .userPoolId(USER_POOL_ID)
                    .build();

            ListUsersResponse response = cognitoClient.listUsers(request);
            response.users().forEach(user -> {
                User u = new User();
                Map<String, String> userAttributesMap = new HashMap<>();
                u.setUsername(user.username());
                u.setCreatedTime(LocalDateTime.ofInstant(user.userCreateDate(), ZoneOffset.UTC));
                u.setUpdatedTime(LocalDateTime.ofInstant(user.userLastModifiedDate(), ZoneOffset.UTC));
                user.attributes().forEach(attribute -> {
                    userAttributesMap.put(attribute.name(), attribute.value());
                });
                u.setId(userAttributesMap.get("sub"));
                u.setEmail(userAttributesMap.get("email"));
                u.setLevel(Integer.parseInt(userAttributesMap.get("custom:Level")));
                userlist.add(u);
            });
            redisService.set("userlist", userlist);
            
            return Result.success(userlist);
        }
        return Result.success(res);
    }

    @GetMapping("/detail")
    public Result getUserDetail(@RequestParam String token) {

        GetUserRequest request = GetUserRequest.builder()
                .accessToken(token)
                .build();
        User u = new User();
        Map<String, String> userAttributesMap = new HashMap<>();      
        try {
            GetUserResponse result = cognitoClient.getUser(request);
            u.setUsername(result.username());
            u.setCreatedTime(null);
            u.setUpdatedTime(null);

            List<AttributeType> userAttributes = result.userAttributes();
            for (AttributeType attribute : userAttributes) {
                userAttributesMap.put(attribute.name(), attribute.value());
            }
            u.setId(userAttributesMap.get("sub"));
            u.setEmail(userAttributesMap.get("email"));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
        try {
            u.setLevel(Integer.parseInt(userAttributesMap.get("custom:Level")));
        } catch (Exception e) {
            u.setLevel(3);
            AttributeType attribute = AttributeType.builder()
                    .name("custom:Level")
                    .value("3")
                    .build();
            UpdateUserAttributesRequest req = UpdateUserAttributesRequest.builder()
                    .accessToken(token)
                    .userAttributes(attribute)
                    .build();
            UpdateUserAttributesResponse resp = cognitoClient.updateUserAttributes(req);
        }

        u.setPassword("");
        return Result.success(u);
    }

    @PutMapping("/update")
    public Result update(@RequestBody User user) {
        List<AttributeType> attributeList = new ArrayList<>();
        AttributeType email = AttributeType.builder()
                .name("email")
                .value(user.getEmail())
                .build();
        AttributeType emailVerified = AttributeType.builder()
                .name("email_verified")
                .value("true")
                .build();
        AttributeType level = AttributeType.builder()
                .name("custom:Level")
                .value(user.getLevel().toString())
                .build();
        attributeList.add(email);
        attributeList.add(level);
        attributeList.add(emailVerified);
        AdminUpdateUserAttributesRequest req = AdminUpdateUserAttributesRequest.builder()
                .userPoolId(USER_POOL_ID)
                .username(user.getUsername())
                .userAttributes(attributeList)
                .build();
        try {
            AdminUpdateUserAttributesResponse resp = cognitoClient.adminUpdateUserAttributes(req);
            redisService.delete("userlist");
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/update_password")
    public Result updatePwd(String password, String username) {
        AdminSetUserPasswordRequest request = AdminSetUserPasswordRequest.builder()
                .userPoolId(USER_POOL_ID)
                .username(username)
                .password(password)
                .permanent(Boolean.TRUE)
                .build();
        try {
            AdminSetUserPasswordResponse response = cognitoClient.adminSetUserPassword(request);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
        return Result.success();
    }

    @DeleteMapping("/delete")
    public Result delete(@RequestParam String username) {
        AdminDeleteUserRequest request = AdminDeleteUserRequest.builder()
                .userPoolId(USER_POOL_ID)
                .username(username)
                .build();
        AdminDeleteUserResponse result = cognitoClient.adminDeleteUser(request);
        redisService.delete("userlist");
        return Result.success();
    }
}
