package com.cloud.rdd.controller;

import com.cloud.rdd.pojo.Defect;
import com.cloud.rdd.pojo.DefectRes;
import com.cloud.rdd.pojo.PageBean;
import com.cloud.rdd.pojo.Result;
import com.cloud.rdd.service.RedisService;
import com.cloud.rdd.service.impl.DefServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/def")
@Validated
public class DefController {
    @Autowired
    private DefServiceImpl defService;
    @Autowired
    private RedisService redisService;

    private final String baseurl = "xxx";
    @GetMapping("/detail")
    public Result<DefectRes> getDetail(@RequestParam Integer imgId) {
        DefectRes def_detail = defService.getDetail(imgId);
        return Result.success(def_detail);
    }

    @PutMapping("update_desc")
    public Result<DefectRes> updateDesc(Integer imgId, String description) {
        defService.updateDesc(imgId, description);
        return Result.success();
    }

    @PutMapping("/update_stat")
    public Result<List<Defect>> updateStat(Integer imgId, Integer defId, Integer stat) {
        defService.updateStat(imgId, defId, stat);
        return Result.success();
    }

    @PutMapping("/update_type")
    public Result<List<Defect>> updateType(Integer imgId, Integer defId, Integer type) {
        defService.updateType(imgId, defId, type);
        Map<String, Object> data = new HashMap<>();
        data.put("id", imgId);
        data.put("def_id", defId);
        data.put("del_mark", 'N');
        WebClient webClient = WebClient.create(baseurl);
        String response = webClient.post()
                .uri("/api/update_img")
                .header("Content-Type", "application/json")
                .bodyValue(data)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        redisService.delete("defect:id:" + defId);
        redisService.delete("detail:" + imgId);
        redisService.delete("detection:id:" + imgId);
        return Result.success();
    }

    @DeleteMapping("/delete")
    public Result deleteDef(@RequestParam Integer defId, @RequestParam Integer imgId) {
        Map<String, Object> data = new HashMap<>();
        System.out.println(imgId);
        data.put("id", imgId);
        data.put("def_id", -1);
        if (defService.deleteDef(defId, imgId)) {
            data.put("del_mark", 'Y');
        }
        data.put("del_mark", 'N');
        WebClient webClient = WebClient.create(baseurl);
        String response = webClient.post()
                .uri("/ml/update_img")
                .header("Content-Type", "application/json")
                .bodyValue(data)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        redisService.delete("defect:id:" + defId);
        redisService.delete("detail:" + imgId);
        redisService.delete("detection:id:" + imgId);
        return Result.success();
    }

    @GetMapping("/def_list")
    public Result<PageBean<Defect>> getDefList(Integer pageNum, Integer pageSize,
            @RequestParam(required = false) String defNum, @RequestParam(required = false) String createdTime,
            @RequestParam(required = false) String updatedTime, @RequestParam String type) {
        PageBean<Defect> list = defService.getDefList(pageNum, pageSize, defNum, createdTime, updatedTime, type);
        return Result.success(list);
    }
}
