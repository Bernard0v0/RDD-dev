import {observer} from "mobx-react-lite";
import detectionstore from "../store/detectionstore";
import defectstore from "../store/defectstore";
import {useEffect} from "react";
import routerstore from "../store/routerstore";
import {Badge, Button, Descriptions, Flex, message} from "antd";
import {Map, Marker} from 'pigeon-maps'
import React, { useState } from 'react';
import { Form, Popconfirm, Table, Typography } from 'antd';
import TextArea from "antd/lib/input/TextArea";
import {useNavigate} from "react-router-dom";
import {
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    UpCircleOutlined,
    VerticalRightOutlined
} from "@ant-design/icons";
function DefectDetail(){
    useEffect(() => {
        defectstore.getDefects()
        routerstore.selectkey='02'

    },[])
    const nav = useNavigate()
    const items = [
        {
            key: '1',
            label: 'Image ID',
            span:4,
            children: detectionstore.detectionId,
        },
        {
            key: '2',
            label: 'Origin Image',
            span:4,
            children:<img alt={''} src={defectstore.defectInfo.imgSourceUrl}></img> ,
        },
        {
            key: '3',
            label: 'Inference Image',
            span:4,
            children: <img alt={''} src={defectstore.defectInfo.imgUrl}></img>,
        },
        {
            key: '4',
            label: 'Location',
            children:   <Map
                key={`${defectstore.latitude}-${defectstore.longitude}`}
                height={500}
                defaultCenter={[defectstore.latitude, defectstore.longitude]}
                defaultZoom={11}
            >
                <Marker width={50} anchor={[defectstore.latitude, defectstore.longitude]} />
            </Map>,
            span: 4
        },
        // {
        //     key: '4',
        //     label: 'Location',
        //     children: (defectstore.defectInfo.latitude!==0 && defectstore.defectInfo.longitude!==0) ? (
        //         <Map height={300} center={[defectstore.defectInfo.latitude, defectstore.defectInfo.longitude]} zoom={11}>
        //             <Marker width={50} anchor={[defectstore.defectInfo.latitude, defectstore.defectInfo.longitude]} />
        //         </Map>
        //     ) : 'No Location info',
        //     span: 4,
        // },
        ]
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
        const inputNode = defectstore.mapLabel(dataIndex)
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

        const [form] = Form.useForm();

        const [editingKey, setEditingKey] = useState('');
        const [descupdate, setDescupdate] = useState(false);
        const isEditing = (record) => record.id === editingKey;
        const edit = (record) => {
            form.setFieldsValue({
                ...record,
            });
            setEditingKey(record.id);
        };
        const cancel = () => {
            setEditingKey('');
        };
        const save = async (record) => {
            try {
                const row = await form.validateFields();
                if (record.stat !== row.stat) {
                    await defectstore.updateStat(record.id, defectstore.mapStatToNum(row.stat))
                }
                if (record.type !== row.type && routerstore.level<2){
                    await defectstore.updateType(record.id, defectstore.mapTypeToNum(row.type))
                }
                setEditingKey('')

            } catch (errInfo) {
                message.error('Validate Failed:', errInfo);
            }
        };
        const onChange = (e)=>{
            setDescupdate(true)
            defectstore.description=e.target.value
        }

        const columns = [
            {
                title: 'Defect ID',
                dataIndex: 'id',
                width: '10%',
                editable: false,
            },
            {
                title: 'Defect Type',
                dataIndex: 'type',
                width: '15%',
                editable: routerstore.level<2,
            },
            {
                title: 'Status',
                dataIndex: 'stat',
                render: (stat) =><Badge status={defectstore.mapStat(stat)} text={stat} />,
                width: '15%',
                editable: routerstore.level<3,
            },
            {
                title: 'Updated By',
                dataIndex: 'updatedBy',
                width: '15%',
                editable: false
            },
            {
                title: 'Updated Time',
                dataIndex: 'updatedTime',
                width: '15%',
                editable: false
            },
            {
                title: 'operation',
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
                        }} onClick={() => edit(record)}>
                            <EditOutlined />Edit
                        </Typography.Link>
                    <Typography.Link type={'danger'} style={{display:routerstore.level < 2?'inline-block':'none'}} disabled={editingKey !== ''}>
                        <Popconfirm title="Sure to delete this defect?" onConfirm={()=>defectstore.deleteDefect(record)}>
                            <DeleteOutlined />Delete defect
                        </Popconfirm>
                    </Typography.Link></span>
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
                <Button icon={<VerticalRightOutlined />} style={{width:'10%'}} type="primary" onClick={()=>{
                detectionstore.detectionId=0
                nav('/detection')
            }}>Go Back</Button>
                <Flex vertical={true} gap={'middle'}>

                <Typography.Title level={4}>General Info</Typography.Title>
                <Descriptions bordered items={items} />
                <Typography.Title level={4}>Defects List</Typography.Title>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={defectstore.defects}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={false}
                />
                    <Typography.Title level={4}>Notes</Typography.Title>
                <TextArea
                    showCount
                    maxLength={500}
                    onChange={onChange}
                    value={defectstore.description}
                    style={{
                        height: 120,
                        resize: 'none',
                    }}
                />
                <Button icon={<UpCircleOutlined />} style={{width:'10%'}} type="primary" disabled={!descupdate}  onClick={()=>defectstore.updateDesc().then(r => setDescupdate(false))
                }>
                     Update
                </Button>
                </Flex>
            </Form>
        );
}
export default observer(DefectDetail);