import axios from 'axios';
import routerstore from "./routerstore";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const instance = axios.create({});


instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            message.error('Unauthorized! Redirecting to login...');
            routerstore.reset()
            const nav = useNavigate()
            nav("/login")
        }
        return Promise.reject(error);
    }
);

export { instance };
