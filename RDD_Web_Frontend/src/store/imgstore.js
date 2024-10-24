
import { message } from "antd";
import { makeAutoObservable, runInAction } from "mobx";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


class imgstore {
    s3Client = new S3Client({
        region: 'region',
        credentials: {
            accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
            secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN,
        },
    });
    async Upload(params, file) {
        try {
            for (let index = 0; index < 1; index++) {
                await this.s3Client.send(new PutObjectCommand(params));
                console.log("submit:",index)
            }
            message.success('File uploaded successfully');
        } catch (error) {
            message.error(`${file.name} failed to upload`)
            console.log(error)
        }
    }
    constructor() {
        makeAutoObservable(this)
    }
}
export default new imgstore