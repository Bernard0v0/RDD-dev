import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import routerstore from "../store/routerstore";
import { Map, Marker } from "pigeon-maps"
import detectionstore from "../store/detectionstore";
import { Badge, Flex, Form, Image, message, Popconfirm, Radio, Select, Space, Table, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import {
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import defectstore from "../store/defectstore";


function findIdByCoordinates(latitude, longitude) {
    const result = detectionstore.detectionList.find(
        item => Number(item.latitude) === Number(latitude) && Number(item.longitude) === Number(longitude)
    );

    return result ? result.id : null;
}
function DetectionList() {
    const nav = useNavigate()
    function generateMarker() {
        const marker = []
        for (let i = 0; i < detectionstore.detectionList.length; i++) {
            marker.push(<Marker width={50} anchor={[Number(detectionstore.detectionList[i].latitude), Number(detectionstore.detectionList[i].longitude)]} onClick={({ anchor: Point }) => {
                detectionstore.detectionId = findIdByCoordinates(Point[0], Point[1])

                nav('/detail')
            }} />)
        }
        return <Map key={`${detectionstore.detectionList.map(item => item.id).join(',') }`} height={'90vh'} defaultCenter={[detectionstore.latitude, detectionstore.longitude]} defaultZoom={11}>
            {marker}
        </Map>

    }
    useEffect(() => {
        routerstore.selectkey = '02'
        detectionstore.getDetectionList()
        detectionstore.getDefectList()
        defectstore.defectInfo = {}
        defectstore.defects = []
        defectstore.description = ''
        defectstore.latitude = 0
        defectstore.longitude = 0

    }, [])
    const onShowSizeChange = (current, pageSize) => {
        detectionstore.pageNum = current
        detectionstore.pageSize = pageSize
        if (detectionstore.view === 'detection') {
            detectionstore.getDetectionList()
        }
        else {
            detectionstore.getDefectList()
        }

    };
    const onPageChange = (values) => {
        detectionstore.pageNum = values
        if (detectionstore.view === 'detection') {
            detectionstore.getDetectionList()
        }
        else {
            detectionstore.getDefectList()
        }
    }
    const uploadOrderedBy = (e) => {
        detectionstore.orderedBy = e.target.value
        if (detectionstore.view === 'detection') {
            detectionstore.getDetectionList()
        }
        else {
            detectionstore.getDefectList()
        }
    }
    const uploadOrder = (e) => {
        detectionstore.order = e.target.value
        if (detectionstore.view === 'detection') {
            detectionstore.getDetectionList()
        }
        else {
            detectionstore.getDefectList()
        }
    }
    const uploadFlitter = (e) => {
        detectionstore.flitter = e.target.value
        if (detectionstore.view === 'detection') {
            detectionstore.getDetectionList()
        }
        else {
            detectionstore.getDefectList()
        }
    }
    const navto = (imgId) => {
        detectionstore.detectionId = imgId;
        nav("/detail")
    }
    const handleChange = (value) => {
        detectionstore.view = value
        detectionstore.pageNum = 1
        if (value === 'defect') {
            detectionstore.orderedBy = 'createdTime'
        }
    }
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
    const isEditing = (record) => record.id === editingKey;
    const edit = (record) => {
        form.setFieldsValue({
            ...record,
        });
        detectionstore.detectionId = record.imgId
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
            if (record.type !== row.type && routerstore.userLevel < 2) {
                await defectstore.updateType(record.id, defectstore.mapTypeToNum(row.type))
            }
            setEditingKey('')

        } catch (errInfo) {
            message.error('Validate Failed:', errInfo);
        }
    };

    const columnsDef = [
        {
            title: 'Detection Image',
            dataIndex: 'imgUrl',
            key: 'imgUrl',
            render: (url) => <Image src={url} width={200} height={200} />
        },
        {
            title: 'Defect ID',
            dataIndex: 'id',
            width: '10%',
            editable: false,
        },
        {
            title: 'Detection ID',
            dataIndex: 'imgId',
            width: '10%',
            editable: false,
        },
        {
            title: 'Defect Type',
            dataIndex: 'type',
            width: '15%',
            editable: routerstore.userLevel < 2,
        },
        {
            title: 'Status',
            dataIndex: 'stat',
            render: (stat) => <Badge status={defectstore.mapStat(stat)} text={stat} />,
            width: '15%',
            editable: routerstore.userLevel < 3,
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
                    <Typography.Link style={{
                        marginInlineEnd: 10,
                    }} onClick={() => navto(record.imgId)}> <UnorderedListOutlined />Detail</Typography.Link>
                    <Typography.Link disabled={editingKey !== ''} style={{
                        marginInlineEnd: 10,
                    }} onClick={() => edit(record)}>
                        <EditOutlined />Edit
                    </Typography.Link>
                    <Typography.Link type={'danger'} style={{ display: routerstore.userLevel < 2 ? 'inline-block' : 'none' }} disabled={editingKey !== ''}>
                        <Popconfirm title="Sure to delete this defect?" onConfirm={() => defectstore.deleteDefect(record)}>
                            <DeleteOutlined />Delete defect
                        </Popconfirm>
                    </Typography.Link></span>
                );
            },
        },
    ];
    const mergedColumns = columnsDef.map((col) => {
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
    const columns = [
        {
            title: 'Detection',
            dataIndex: 'imgUrl',
            key: 'imgUrl',
            render: (url) => <Image src={url} width={200} height={200} />
        },
        {
            title: 'Id',
            dataIndex: 'id',
        },
        {
            title: 'Defect Nums',
            dataIndex: 'defNum',
        },
        {
            title: 'Complete Defect Nums',
            dataIndex: 'completeNum',
        },
        {
            title: 'Created Time',
            dataIndex: 'createdTime',
        },
        {
            title: 'Updated Time',
            dataIndex: 'updatedTime',
        },
        {
            title: 'Operation',
            key: 'Operation',
            render: (_, record) => (
                <span>
                    <Typography.Link style={{
                        marginInlineEnd: 10,
                    }} onClick={() => navto(record.id)}> <UnorderedListOutlined />Detail</Typography.Link>
                    <Typography.Link type={'danger'} style={{ display: routerstore.userLevel < 2 ? 'inline-block' : 'none' }}>
                        <Popconfirm title="Sure to delete this detection?" onConfirm={() => detectionstore.deleteDetection(record.id)}>
                            <DeleteOutlined />Delete detection
                        </Popconfirm>
                    </Typography.Link>
                </span>
            )
        }
    ]
    return (
        <Flex vertical={true} gap={"middle"}>
            <Flex gap={'middle'} align={'center'} style={{ display: detectionstore.view !== 'map' ? '' : 'none' }}>
                <Typography.Text strong>Ordered By: </Typography.Text>
                <Radio.Group defaultValue="createdTime" value={detectionstore.orderedBy} buttonStyle="solid">
                    <Radio.Button value="createdTime" onChange={(e) => {
                        uploadOrderedBy(e)
                    }}>Created Time</Radio.Button>
                    <Radio.Button value="updatedTime" onChange={(e) => {
                        uploadOrderedBy(e)
                    }}>Updated Time</Radio.Button>
                    <Radio.Button value="defNum" disabled={detectionstore.view==='defect'?true:false} onChange={(e) => {
                        uploadOrderedBy(e)
                    }}>Defect Number</Radio.Button>
                </Radio.Group>
                <Typography.Text strong>Order: </Typography.Text>
                <Radio.Group defaultValue="asc" value={detectionstore.order} buttonStyle="solid">
                    <Radio.Button value="asc" onChange={(e) => {
                        uploadOrder(e)
                    }}>Ascending</Radio.Button>
                    <Radio.Button value="desc" onChange={(e) => {
                        uploadOrder(e)
                    }}>Descending</Radio.Button>
                </Radio.Group>
                <Typography.Text strong>Flitter: </Typography.Text>
                <Radio.Group defaultValue="all" value={detectionstore.flitter} buttonStyle="solid">
                    <Radio.Button value="all" onChange={(e) => {
                        uploadFlitter(e)
                    }}>All</Radio.Button>
                    <Radio.Button value="crack" onChange={(e) => {
                        uploadFlitter(e)
                    }}>Crack</Radio.Button>
                    <Radio.Button value="pothole" onChange={(e) => {
                        uploadFlitter(e)
                    }}>Pothole</Radio.Button>
                </Radio.Group>
            </Flex>
            <Flex gap={'middle'} align={'center'}>
                <Typography.Text strong>View: </Typography.Text>
                <Select
                    defaultValue="detection"
                    value={detectionstore.view}
                    onChange={handleChange}
                    style={{ width: '10%' }}
                    options={[
                        { value: 'detection', label: 'Detection' },
                        { value: 'defect', label: 'Defect' },
                        { value: 'map', label: 'Map' },
                    ]}
                /></Flex>
            <Table style={{ display: detectionstore.view === 'detection' ? 'inline-block' : 'none' }} columns={columns} dataSource={detectionstore.detectionList} pagination={{
                showSizeChanger: true,
                onShowSizeChange: onShowSizeChange,
                defaultCurrent: 1,
                current: detectionstore.pageNum,
                pagSize: detectionstore.pageSize,
                onChange: onPageChange,
                total: detectionstore.total
            }}
            />
            <Space style={{ display: detectionstore.view === 'defect' ? 'inline-block' : 'none' }}>
                <Form form={form} component={false}>
                    <Table
                        components={{
                            body: {
                                cell: EditableCell,
                            },
                        }}
                        bordered
                        dataSource={detectionstore.defectList}
                        columns={mergedColumns}
                        rowClassName="editable-row"
                        pagination={{
                            showSizeChanger: true,
                            onShowSizeChange: onShowSizeChange,
                            defaultCurrent: 1,
                            current: detectionstore.pageNum,
                            pagSize: detectionstore.pageSize,
                            onChange: onPageChange,
                            total: detectionstore.total
                        }}
                    />
                </Form>
            </Space>
            <Space style={{ display: detectionstore.view === 'map' ? 'inline-block' : 'none' }}>
                {generateMarker()}
            </Space>
        </Flex>)
}

export default observer(DetectionList);