import { makeAutoObservable, runInAction } from "mobx";
import { instance } from "./Axios";
import { message } from "antd";
import defectstore from "./defectstore";

class detectionstore {
    detectionList = []
    detectionId = 0;
    pageNum = 1
    pageSize = 10
    total = 0
    orderedBy = 'createdTime'
    order = 'asc'
    flitter = 'all'
    view = 'detection'
    latitude = 0
    longitude = 0
    defectList = []

    async getDetectionList() {
        let url = `/det/det_list?pageNum=${this.pageNum}&pageSize=${this.pageSize}`
        if (this.orderedBy !== undefined && this.orderedBy !== null) {
            url += `&${this.orderedBy}=${this.order}`;
        }
        url += `&type=${this.flitter}`
        const resp = await instance.get(url)
        runInAction(() => {

            this.detectionList = resp.data.data.items
            this.total = resp.data.data.total
            try {
                this.latitude = resp.data.data.items === null ? 0 : Number(resp.data.data.items[0].latitude)
                this.longitude = resp.data.data.items === null ? 0 : Number(resp.data.data.items[0].longitude)
            }
            catch (error) {
                this.latitude = 0;
                this.longitude = 0;
            }

        })
    }
    async getDefectList() {
        let url = `/def/def_list?pageNum=${this.pageNum}&pageSize=${this.pageSize}`
        if (this.orderedBy !== undefined && this.orderedBy !== null) {
            url += `&${this.orderedBy}=${this.order}`;
        }
        url += `&type=${this.flitter}`
        const resp = await instance.get(url)
        runInAction(() => {
            this.defectList = resp.data.data.items
            this.total = resp.data.data.total
            for (let def of this.defectList) {
                def.type = defectstore.mapNumToType(def.type)
                def.stat = defectstore.mapNumToStat(def.stat)
            }
        })
    }
    async deleteDetection(id) {
        let url = `/det/delete?id=${id}`
        const resp = await instance.delete(url)
        runInAction(() => {
            if (resp.data.code === 0) {
                message.success("Detection deleted")
                this.getDetectionList()
            }
            else {
                message.error(resp.data.message)
            }
        })
    }
    constructor() {
        makeAutoObservable(this)
    }
}
export default new detectionstore;