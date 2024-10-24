import React from 'react';
import { lazy } from 'react'
import { Navigate, Link } from 'react-router-dom';
import Home from '../pages/Home.js';
import Page404 from '../pages/Page404.js';
import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import Login from "../pages/Login.js";
import userstore from "./userstore.js";
import detectionstore from "./detectionstore.js";
import defectstore from "./defectstore.js";
import { jwtDecode } from "jwt-decode";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { instance } from './Axios.js';
function convertMenu(m) {
    const Label = m.routePath ? <Link to={m.routePath}>{m.label}</Link> : m.label
    return {
        key: m.key,
        label: Label,
    }
}

class routerstore {

    Routes = [{ path: '/login', element: 'Login' }]
    Menu = [{ key: '01', label: 'Login', routePath: '/login' }]
    token = ''
    state = 'pending'
    selectkey = '01'
    code = ''
    url = ''
    client = new SSMClient({
        region: "ap-southeast-2",
        credentials: {
            accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
            secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN,
        },
    });
    async login(code) {
        const parameter_name = "parameterstore_root";

        try {
            const response = await this.client.send(
                new GetParameterCommand({
                    Name: parameter_name,
                })
            );
            runInAction(() => {
                this.url = response.Parameter.Value;
                instance.defaults.baseURL = this.url
            })

        } catch (error) {
            console.log(error);
        }
        const formData = new FormData();
        formData.append('code', code);
        formData.append('type', 'Web')
        const resp1 = await axios.post(this.url + "/user/token", formData)
        runInAction(() => {
            this.token = resp1.data.data.token
            localStorage.setItem('token', this.token);
            localStorage.setItem('access_token', resp1.data.data.access_token)
        }
        )
    }
    get menus() {
        return this.Menu.map(convertMenu)
    }
    get routes() {
        function load(name) {
            if (name === "UserList") {
                const Page = lazy(() => import(`../pages/${name}.tsx`))
                return <Page />
            }
            else {
                const Page = lazy(() => import(`../pages/${name}.js`))
                return <Page />
            }

        }
        const routelist = [
            { path: '/', element: <Home />, children: [] },
            { path: '/404', element: <Page404 /> },
            { path: '/login', element: <Login /> },
            { path: '/*', element: <Navigate to={'/404'}></Navigate> }
        ]
        routelist[0].children = this.Routes.map((r) => {
            return {
                path: r.path,
                element: load(r.element),
            }
        })
        return routelist
    }
    get user() {
        if (this.token.length === 0) {
            return 'visitor'
        }
        else {
            try {
                const decoded = jwtDecode(this.token);
                return decoded['cognito:username']
            }
            catch (error) {
                console.error(error)
            }
        }
    }
    get tokenUrl() {
        return this.url + "/user/token"
    }

    get level() {
        localStorage.getItem('token')
        const decoded = jwtDecode(this.token);
        return Number(decoded['custom:Level'])
    }

    get userId() {
        if (this.token.length === 0) {
            return 'visitor'
        }
        try {
            const decoded = jwtDecode(this.token);
            return decoded.sub
        }
        catch (error) {
            console.error(error)
        }
    }
    async getUrl() {
        const parameter_name = "parameterstore_root";
        try {
            const response = await this.client.send(
                new GetParameterCommand({
                    Name: parameter_name,
                })
            );
            runInAction(() => {
                this.url = response.Parameter.Value;
                instance.defaults.baseURL = this.url
            })

        } catch (error) {
            console.log(error);
        }
    }

    constructor() {
        makeAutoObservable(this)
        const json = localStorage.getItem('Routes')
        this.Routes = json ? JSON.parse(json) : [{ path: '/login', element: 'Login' }]
        const json1 = localStorage.getItem('Menu')
        this.Menu = json1 ? JSON.parse(json1) : [{ key: '01', label: 'Login', routePath: '/login' }]
        this.token = localStorage.getItem('token') ?? ''
        this.state = 'pending'
    }
    reset() {
        localStorage.removeItem('Routes')
        this.Routes = [{ path: '/login', element: 'Login' }]
        localStorage.removeItem('Menu')
        this.Menu = [{ key: '01', label: 'Login', routePath: '/login' }]
        localStorage.removeItem('token')
        this.token = ''
        this.state = 'pending'
        this.selectkey = '01'
        this.code = ''
        this.url = ''
        userstore.user = {}
        userstore.userList = []
        detectionstore.detectionList = []
        detectionstore.detectionId = 0;
        detectionstore.pageNum = 1
        detectionstore.pageSize = 10
        detectionstore.total = 0
        detectionstore.orderedBy = 'createdTime'
        detectionstore.order = 'asc'
        detectionstore.flitter = 'all'
        detectionstore.view = 'detection'
        detectionstore.latitude = 0
        detectionstore.longitude = 0
        detectionstore.defectList = []
        defectstore.defectInfo = {}
        defectstore.defects = []
        defectstore.description = ''
        defectstore.latitude = 0
        defectstore.longitude = 0
    }
}
export default new routerstore