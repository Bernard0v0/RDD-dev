import { makeAutoObservable, runInAction } from "mobx";
import { instance } from "./Axios";
import { message } from "antd";


class usersotre {
    user = {}
    userList = []
    mapLevelToRole(level) {
        const levelMapping = {
            0: 'Administrator',
            1: 'Defects Manager',
            2: 'Road Worker',
            3: 'General User'
        };
        return levelMapping[level]
    }
    mapRoleToLevel(role) {
        const levelMapping = {
            'Administrator': 0,
            'Defects Manager': 1,
            'Road Worker': 2,
            'General User': 3
        };
        return levelMapping[role]
    }

    async getUser(token) {
        let url = `/user/detail?token=${token}`
        const resp = await instance.get(url)
        runInAction(() => {
            this.user = resp.data.data;

        })
    }
    async createUser(value) {
        const formData = new FormData();
        formData.append('username', value.username);
        formData.append('password', value.password);
        formData.append('email', value.email);
        formData.append('level', this.mapRoleToLevel(value.level));
        let url = `/user/create_account`
        const resp = await instance.post(url, formData)
        runInAction(() => {
            if (resp.data.code === 0) {
                message.success("User created")
                this.getUserList()
            }
            else {
                message.error(resp.data.message)
            }
        })
    }
    async deleteUser(username) {
        let url = `/user/delete?username=${username}`
        console.log(url)
        const resp = await instance.delete(url)
        runInAction(() => {
            if (resp.data.code === 0) {
                message.success("User deleted")
                this.getUserList()
            }
            else {
                message.error(resp.data.message)
            }
        })
    }

    async updatePassword(password, username) {
        const formData = new FormData();
        formData.append('password', password);
        formData.append('username', username);
        let url = '/user/update_password'
        const resp = await instance.post(url, formData)
        runInAction(() => {
            if (resp.data.code === 0) {
                message.success("Password changed")
            }
            else {
                message.error(resp.data.message)
            }
        })
    }
    async updateUser(id, username, email, level) {
        let url = `/user/update`
        const resp = await instance.put(url, {
            id: id,
            username: username,
            email: email,
            level: level
        })
        runInAction(() => {
            if (resp.data.code === 0) {
                this.user = resp.data.data;
                this.getUserList()
            }
            else {
                message.error(resp.data.message)
            }
        })
    }
    async getUserList() {
        let url = `/user/user_list`
        const resp = await instance.get(url)
        runInAction(() => {
            this.userList = resp.data.data
            for (let user of this.userList) {
                user.level = this.mapLevelToRole(user.level)
            }
        })
    }
    constructor() {
        makeAutoObservable(this)
    }
}
export default new usersotre