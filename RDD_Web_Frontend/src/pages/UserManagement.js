import {observer} from "mobx-react-lite";
import React, {useEffect, useState} from 'react';
import {Form, Input, message, Modal, Popconfirm, Select, Table, Typography, Radio, Button, Flex} from 'antd';

import routerstore from "../store/routerstore";
import userstore from "../store/userstore";
import defectstore from "../store/defectstore";
import {
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    FormOutlined, SaveOutlined,
    SearchOutlined,
    UserAddOutlined,
    UserDeleteOutlined
} from "@ant-design/icons";
const { Search } = Input;
const EditableCell = ({
                          editing,
                          dataIndex,
                          title,
                          inputType,
                          record,
                          index,
                          children,
                          ...restProps
                      }) => {
    const inputNode = dataIndex==="level"?<Select options={[{value:userstore.mapLevelToRole(0),label:<span>{userstore.mapLevelToRole(0)}</span>},{value:userstore.mapLevelToRole(1),label:<span>{userstore.mapLevelToRole(1)}</span>},{value:userstore.mapLevelToRole(2),label:<span>{userstore.mapLevelToRole(2)}</span>},{value:userstore.mapLevelToRole(3),label:<span>{userstore.mapLevelToRole(3)}</span>}]} /> :<Input />;
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    style={{
                        margin: 0,
                    }}
                    rules={[
                        {
                            required: true,
                            message: `Please Input ${title}!`,
                        },
                    ]}
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

function UserManagement(){
    useEffect(() => {
        routerstore.selectkey = '03'
        userstore.getUserList()
    }, [])
    const [open, setOpen] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const showModal = (record) => {
        setOpen(true);
        formUpdate.setFieldValue({
            password:''
        })
    };
    const showModalCreate = (record) => {
        formCreate.setFieldValue({
            username:'',
            password:'',
            email:'',
            level:''
        })
        setOpenCreate(true);
    };
    const handleOk = async (record) => {
        setConfirmLoading(true);
        const values = await formUpdate.validateFields();
        await userstore.updatePassword(values.password,record.username);
        setOpen(false);
        setConfirmLoading(false);
    };
    const createUser = async (record) => {
        setConfirmLoading(true);
        const values = await formCreate.validateFields();
        await userstore.createUser(values);
        setOpenCreate(false);
        setConfirmLoading(false);

    };
    const handleCancel = () => {
        setOpen(false);
    };
    const handleCancelCreate = () => {
        setOpenCreate(false);
    };

        const [form] = Form.useForm();
        const [formUpdate] = Form.useForm();
        const [formCreate] = Form.useForm();
        const [loadstate,setLoadstate] = useState(false)
        const data = userstore.userList
        const [editingKey, setEditingKey] = useState('');
        const isEditing = (record) => record.id === editingKey;
        const edit = (record) => {
            form.setFieldsValue({
                username: '',
                email: '',
                level: '',
                ...record,
            });
            setEditingKey(record.id);
        };
        const cancel = (value) => {
            setEditingKey('');
        };
        const save = async (record) => {
            try {
                const row = await form.validateFields();
                userstore.updateUser(record.id,record.username,row.email,userstore.mapRoleToLevel(row.level))
                setEditingKey('')
            } catch (errInfo) {
                message.error('Validate Failed:', errInfo);
            }
        };
        const columns = [
            {
                title: 'User ID',
                dataIndex: 'id',
                width: '10%',
                editable: false,
            },
            {
                title: 'Username',
                dataIndex: 'username',
                width: '10%',
                editable: false,
            },
            {
                title: 'Email',
                dataIndex: 'email',
                width: '20%',
                editable: true,
            },
            {
                title: 'User Role',
                dataIndex: 'level',
                width: '15%',
                editable: true,
                filters: [
                    {
                        text: 'Administrator',
                        value: 'Administrator',
                    },
                    {
                        text: 'Defects Manager',
                        value: 'Defects Manager',
                    },
                    {
                        text: 'Road Worker',
                        value: 'Road Worker',
                    },
                    {
                        text: 'General User',
                        value: 'General User',
                    },
                ],
                onFilter: (value, record) => record.level.indexOf(value) === 0,
            },
            {
                title: 'Created Time',
                dataIndex: 'createdTime',
                width: '15%',
                editable: false,
            },
            {
                title: 'Updated TIme',
                dataIndex: 'updatedTime',
                width: '15%',
                editable: false,
            },
            {
                title: 'Operation',
                dataIndex: 'operation',
                render: (_, record) => {
                    const editable = isEditing(record);
                    return editable ? (
                        <span>
            <Typography.Link
                onClick={() => save(record)}
                style={{
                    marginInlineEnd: 8,
                }}
            >
              <SaveOutlined /> Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a><CloseCircleOutlined />Cancel</a>
            </Popconfirm>
          </span>
                    ) : (<span>
                        <Typography.Link disabled={editingKey !== ''} style={{
                            marginInlineEnd: 10,
                        }} onClick={() => edit(record)}> <EditOutlined />
                            Edit
                        </Typography.Link>
                            <Typography.Link disabled={editingKey !== ''} style={{
                                marginInlineEnd: 10,
                            }} onClick={showModal}> <FormOutlined />
                            Change password
                        </Typography.Link>
                                                        <Typography.Link type={'danger'} disabled={editingKey !== ''}>
                            <Popconfirm title="Sure to delete this user?" onConfirm={()=>userstore.deleteUser(record.username)}>
              <UserDeleteOutlined />Delete user
            </Popconfirm>
                        </Typography.Link>
                            <Modal
                                title="Change the password"
                                open={open}
                                onOk={()=>handleOk(record)}
                                confirmLoading={confirmLoading}
                                onCancel={handleCancel}
                            >
          <Form form={formUpdate} layout="vertical" autoComplete="off" >
              <Form.Item
                  label="New Password"
                  name="password"
                  rules={[
                      {
                          required: true,
                          message: 'Please enter the password!',
                      },
                  ]}
              >
                  <Input.Password />
              </Form.Item>
          </Form>
      </Modal>
                    </span>
                    );

                },

            },
        ];
        const mergedColumns = columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record) => ({
                    record,
                    inputType: 'text',
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                }),
            };
        });

    return (

            <Form form={form} component={false}>
                <Flex vertical={true} gap={'middle'}>
                <Button icon={<UserAddOutlined />} type="primary" onClick={showModalCreate} style={{width:'10%'}}>
                Create User
            </Button>
                <Modal
                    title="Create a user"
                    open={openCreate}
                    onOk={createUser}
                    confirmLoading={confirmLoading}
                    onCancel={handleCancelCreate}
                >
                    <Form form={formCreate} layout="vertical" autoComplete="off" >
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter username!',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter password!',
                                },
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter email!',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Role"
                            name="level"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please select a role!',
                                },
                            ]}
                        >
                            <Select options={[{value:userstore.mapLevelToRole(0),label:<span>{userstore.mapLevelToRole(0)}</span>},{value:userstore.mapLevelToRole(1),label:<span>{userstore.mapLevelToRole(1)}</span>},{value:userstore.mapLevelToRole(2),label:<span>{userstore.mapLevelToRole(2)}</span>},{value:userstore.mapLevelToRole(3),label:<span>{userstore.mapLevelToRole(3)}</span>}]} />
                        </Form.Item>
                    </Form>
                </Modal>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={data}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={{
                    }}
                />
                </Flex>
            </Form>
        );
}
export default observer(UserManagement)