import { makeAutoObservable, runInAction } from "mobx";
import detectionstore from "./detectionstore";
import { instance } from "./Axios";
import { Badge, Input, message, Select } from "antd";
import React from "react";
class defectstore {
    defectInfo = {}
    defects = []
    description = ''
    latitude = 0
    longitude = 0
    mapNumToStat(num) {
        const StatMapping = {
            0: 'Waiting for maintenance',
            1: 'Maintenance in progress',
            2: 'Fixed',
            3: 'Ignore'
        };
        return StatMapping[num]
    }
    mapStatToNum(stat) {
        const StatMapping = {
            'Waiting for maintenance': 0,
            'Maintenance in progress': 1,
            'Fixed': 2,
            'Ignore': 3
        };
        return StatMapping[stat]
    }
    mapNumToType(num) {
        const TypeMapping = {
            0: 'Longitudinal crack',
            1: 'Transverse crack',
            2: 'Alligator crack',
            3: 'Pothole'
        };
        return TypeMapping[num]
    }
    mapTypeToNum(type) {
        const TypeMapping = {
            'Longitudinal crack': 0,
            'Transverse crack': 1,
            'Alligator crack': 2,
            'Pothole': 3
        };
        return TypeMapping[type]
    }
    mapStat(stat) {
        const statNum = this.mapStatToNum(stat)
        const StatMapping = {
            0: 'default',
            1: 'processing',
            2: 'success',
            3: 'error'
        };
        return StatMapping[statNum]
    }
    mapLabel(dataindex) {
        if (dataindex === 'type') {
            return <Select options={[{ value: this.mapNumToType(0), label: <span>{this.mapNumToType(0)}</span> }, { value: this.mapNumToType(1), label: <span>{this.mapNumToType(1)}</span> }, { value: this.mapNumToType(2), label: <span>{this.mapNumToType(2)}</span> }, { value: this.mapNumToType(3), label: <span>{this.mapNumToType(3)}</span> }]} />
        }
        else if (dataindex === 'stat') {
            return <Select options={[{ value: this.mapNumToStat(0), label: <Badge status="default" text={this.mapNumToStat(0)} /> }, { value: this.mapNumToStat(1), label: <Badge status="processing" text={this.mapNumToStat(1)} /> }, { value: this.mapNumToStat(2), label: <Badge status="success" text={this.mapNumToStat(2)} /> }, { value: this.mapNumToStat(3), label: <Badge status="error" text={this.mapNumToStat(3)} /> }]} />
        }
        else {
            return <Input />
        }
    }
    async getDefects() {
        let url = `/def/detail?imgId=${detectionstore.detectionId}`
        
        const resp = await instance.get(url)
        runInAction(() => {
            this.defectInfo = resp.data.data.defBaseInfo
            this.defects = resp.data.data.defects
            try {
                this.description = this.defectInfo.description
                this.latitude = this.defectInfo.latitude
                this.longitude = this.defectInfo.longitude

            }
            catch (err) {
                this.description = ''
                this.latitude = 0
                this.longitude = 0
            }

            for (let def of this.defects) {
                def.type = this.mapNumToType(def.type)
                def.stat = this.mapNumToStat(def.stat)
            }
        })
    }
    async updateDesc() {
        let url = '/def/update_desc'
        const formData = new FormData();
        formData.append('imgId', detectionstore.detectionId);
        formData.append('description', this.description);
        await instance.put(url, formData)
        runInAction(() => {
            this.getDefects()
        })
    }
    async updateStat(defId, stat) {
        let url = '/def/update_stat'
        const formData = new FormData();
        formData.append('imgId', detectionstore.detectionId);
        formData.append('defId', defId);
        formData.append('stat', stat);
        await instance.put(url, formData)
        runInAction(() => {
            message.success("Updated status success")
            this.getDefects()
            detectionstore.getDefectList()
        })
    }
    async updateType(defId, type) {
        let url = '/def/update_type'
        const formData = new FormData();
        formData.append('imgId', detectionstore.detectionId);
        formData.append('defId', defId);
        formData.append('type', type);
        await instance.put(url, formData)
        runInAction(() => {
            message.success("Updated type success")
            this.getDefects()
            detectionstore.getDefectList()
        })
    }
    async deleteDefect(record) {
        let url = `/def/delete?defId=${record.id}&imgId=${record.imgId}`
        const resp = await instance.delete(url)
        runInAction(() => {
            if (resp.data.code === 0) {
                message.success("Defect deleted")
                this.getDefects()
                detectionstore.getDefectList()
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
export default new defectstore