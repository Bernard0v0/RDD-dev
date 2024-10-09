import axios from "axios";
import { message } from "antd";
import { instance } from "./Axios";
import { makeAutoObservable, runInAction } from "mobx";

class imgstore {
    latitude = 0
    longitude = 0
    presignedUrl = ''

    async getPresignedUrl(objectkey) {
        const url = `/img/generate-presigned-url?bucketName=xxx&objectKey=${objectkey}`
        const resp = await instance.get(url)
        runInAction(() => {
            this.presignedUrl = resp.data.data
        })
    }
    async Upload(params, file) {
        try {
            await this.getPresignedUrl(params['Key'])
            console.log(this.presignedUrl)
            await axios.put(this.presignedUrl, params['Body'])
            message.success(`upload successfully`);
            const formData = new FormData();
            formData.append('latitude', this.latitude);
            formData.append('longitude', this.longitude);
            formData.append('imgSourceUrl', `xxx/${params['Key']}`);

            const url = "/img/update";
            const resp = await instance.post(url, formData);
            runInAction(() => {
                if (resp.data.code === 0) {
                    message.success(`${file.name} Detect successfully`);
                }
                else {
                    message.error(resp.data.message)
                }
            })
        } catch (error) {
            message.error(`${file.name} failed to upload, connection lost`)
        }
    }
    constructor() {
        makeAutoObservable(this)
    }
}
export default new imgstore