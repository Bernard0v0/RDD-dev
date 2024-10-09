import { observer} from "mobx-react-lite"
import routerstore from "../store/routerstore"
import {Button, Popconfirm, Col, Row, Descriptions, Modal, Form, Input, Flex} from "antd"
import { useNavigate } from "react-router-dom"
import React, {useEffect, useState} from "react"
import userstore from "../store/userstore";
import {EditOutlined, LogoutOutlined} from "@ant-design/icons";
import axios from "axios";
import {instance} from "../store/Axios";
function User() {
    const [form] = Form.useForm();
    const nav = useNavigate()
    useEffect(() => {

        routerstore.selectkey = '04'
        userstore.getUser(localStorage.getItem('access_token'))
      if (!localStorage.getItem('token')) {

        confirm()
      }
    }, [])
    const confirm = (e) => {
        routerstore.reset()
        window.location.href = 'xxx'
};

    const items = [
        {
            key: '1',
            label: 'User Id',
            children: routerstore.userId,
        },
        {
            key: '2',
            label: 'Username',
            children: userstore.user.username,
        },
        {
            key: '3',
            label: 'Email',
            children: userstore.user.email,
        },
        {
            key: '4',
            label: 'User Level',
            children: userstore.mapLevelToRole(userstore.user.level),
        },
        // {
        //     key: '5',
        //     label: 'Create Time',
        //     children: userstore.user.createdTime,
        // },
        // {
        //     key: '6',
        //     label: 'Last Update',
        //     children: userstore.user.updatedTime,
        // },
    ];
  return <Flex vertical={true} gap={'middle'} justify={'center'} align={'center'}>
      <Descriptions
          bordered
          title="User Info"
          size={"default"}
          items={items}
      />
      <Popconfirm
    title="Logout"
    description="Are you sure to Log out?"
    onConfirm={confirm}
    okText="Yes"
    cancelText="No"
  >
<Button type="primary" icon={<LogoutOutlined />} style={{width:'10%'}}>Logout</Button>
  </Popconfirm>
   
      </Flex>
  
}
export default observer(User)