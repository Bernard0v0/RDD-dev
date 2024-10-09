package com.cloud.rdd.utils;

import java.util.HashMap;
import java.util.Map;

/**
 * ThreadLocal 工具类
 */
@SuppressWarnings("all")
public class ThreadLocalUtil {
    private static final ThreadLocal THREAD_LOCAL = new ThreadLocal();

    public static <T> T get(){
        return (T) THREAD_LOCAL.get();
    }

    public static void set(Object value){
        THREAD_LOCAL.set(value);
    }

    public static void remove(){
        THREAD_LOCAL.remove();
    }
}
