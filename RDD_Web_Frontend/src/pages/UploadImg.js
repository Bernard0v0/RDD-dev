import {observer} from "mobx-react-lite";
import React, {useEffect, useState} from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {Flex, Image, message, Upload} from 'antd';
import imgstore from "../store/imgstore";
import { v4 as uuidv4 } from 'uuid';
import ExifReader from 'exifreader';
import routerstore from "../store/routerstore";
import {runInAction} from "mobx";
import userstore from "../store/userstore";
const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });


function UploadImg() {
    useEffect(() => {
        routerstore.selectkey = '01'
    }, [])
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };
    const [fileList, setFileList] = useState([])
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error(`${file.name} is not an image file.`);
            return Upload.LIST_IGNORE;
        }
        return true;
    };
    const handleChange = ({ fileList: newFileList }) => {setFileList(newFileList)
   }
    const handleUpload = async ({ file }) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const tags = ExifReader.load(arrayBuffer);
            const { GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef } = tags;
            let latitude = GPSLatitude ? GPSLatitude.description : 0.0;
            let longitude = GPSLongitude ? GPSLongitude.description : 0.0;
            if (GPSLatitudeRef !== undefined || GPSLongitudeRef !== undefined) {
            latitude = GPSLatitudeRef.description === "North latitude" ? Number(latitude) : -Number(latitude);
            longitude = GPSLongitudeRef.description === "East longitude" ? Number(longitude) : -Number(longitude);
            }
            runInAction(() => {
                imgstore.latitude = latitude;
                imgstore.longitude = longitude;
            });

            const fileName = `${uuidv4()}.jpg`;

            const params = {
                Bucket: 'xxx',
                Key: fileName,
                Body: file,
                ACL: 'public-read',
            };

            await imgstore.Upload(params, file);

            runInAction(() => {
                const updatedFileList = [...fileList];
                updatedFileList[updatedFileList.length - 1] = {
                    ...updatedFileList[updatedFileList.length - 1],
                    status: 'done',
                    url: imgstore.imageUrl,
                };
                setFileList(updatedFileList);
            });

        } catch (error) {
            runInAction(() => {
                console.log(error)
                const updatedFileList = [...fileList];
                updatedFileList[updatedFileList.length - 1] = {
                    ...updatedFileList[updatedFileList.length - 1],
                    status: 'error',
                };
                setFileList(updatedFileList);
            });
            message.error(`${file.name} upload failed.`);
        }
    };

    const uploadButton = (
        <button
            style={{
                border: 0,
                background: 'none',
            }}
            type="button"
        >
            <PlusOutlined />
            <div
                style={{
                    marginTop: 8,
                }}
            >
                Upload
            </div>
        </button>
    );

    return (
        <>
            <Flex justify={"flex-start"} align={"center"} vertical={true} >
                <h1>Start upload images...</h1>
                <Upload
                    customRequest={handleUpload}
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    beforeUpload={beforeUpload}
                >
                    {fileList.length >= 50 ? null : uploadButton}
                </Upload>
                {previewImage && (
                    <Image
                        wrapperStyle={{
                            display: 'none',
                        }}
                        preview={{
                            visible: previewOpen,
                            onVisibleChange: (visible) => setPreviewOpen(visible),
                            afterOpenChange: (visible) => !visible && setPreviewImage(''),
                        }}
                        src={previewImage}
                    />
                )}</Flex>
        </>
    );
}

export default observer(UploadImg);