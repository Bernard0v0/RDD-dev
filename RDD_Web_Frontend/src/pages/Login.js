import { observer } from "mobx-react-lite"
import React, { useEffect } from 'react';
import { Button, Form, Input } from 'antd';
import routerstore from "../store/routerstore.js";
import { useNavigate } from "react-router-dom";
import Logo from '../assets/logo.jpg'
import axios from "axios";
import userstore from "../store/userstore";
import { makeAutoObservable, runInAction } from 'mobx';
function Login() { 
    const nav = useNavigate()
    const onFinish = () => {
        window.location.href = "xxx";
    };
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code!==null&&code!==undefined) {
            routerstore.login(code)
                }
    }, []);

    useEffect(() => {
        if (routerstore.token !== '') {
            
            userstore.getUser(localStorage.getItem('access_token')).then(()=>{
                switch (userstore.user.level){
                    case 0:
                        routerstore.Menu = [{ key: '01', label: 'Upload Image', routePath: '/upload' }, { key: '02', label: 'Detection List', routePath: '/detection' }, { key: '03', label: 'User Management', routePath: '/management' },{ key: '04', label: 'User', routePath: '/user' }]
                        routerstore.Routes = [{ path: '/user', element: 'User' }, { path: '/upload', element: 'UploadImg' }, { path: '/detection', element: 'DetectionList' }, { path: '/management', element: 'UserManagement'}, { path: '/detail', element: 'DefectDetail' }]
                        break;
                    case 1:
                        routerstore.Menu = [{ key: '01', label: 'Upload Image', routePath: '/upload' }, { key: '02', label: 'Detection List', routePath: '/detection' }, { key: '04', label: 'User', routePath: '/user' }]
                        routerstore.Routes = [{ path: '/user', element: 'User' }, { path: '/upload', element: 'UploadImg' }, { path: '/detection', element: 'DetectionList' },{ path: '/detail', element: 'DefectDetail' }]
                        break;
                    case 2:
                        routerstore.Menu = [{ key: '01', label: 'Upload Image', routePath: '/upload' }, { key: '02', label: 'Detection List', routePath: '/detection' }, { key: '04', label: 'User', routePath: '/user' }]
                        routerstore.Routes = [{ path: '/user', element: 'User' }, { path: '/upload', element: 'UploadImg' }, { path: '/detection', element: 'DetectionList' },{ path: '/detail', element: 'DefectDetail' }]
                        break;
                    case 3:
                        routerstore.Menu = [{ key: '01', label: 'Upload Image', routePath: '/upload' }, { key: '04', label: 'User', routePath: '/user' }]
                        routerstore.Routes = [{ path: '/user', element: 'User' }, { path: '/upload', element: 'UploadImg' }]
                        break;
                }
                localStorage.setItem('Routes', JSON.stringify(routerstore.Routes))
                localStorage.setItem('Menu',JSON.stringify(routerstore.Menu))
                routerstore.selectkey = '01'

                nav('/upload')
            })

            }
     },[routerstore.token])
  return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '92vh' }}>
    <div style={{ width: 200, height: 200, backgroundSize: 'contain' }}>
      <img src={Logo} alt="Logo" style={{ width: '100%', height: '100%' }} />
    </div>
    <h1 style={{ marginBottom: '2rem' }}>RDD Backend Site</h1>

    <Button type="primary" htmlType="submit" onClick={onFinish}>
      Login / Register
    </Button>
  </div>
 
}
export default observer(Login)