import { defineStore } from "pinia";
import { base64Stringify, base64Parse, md5 } from "../../common/Utils";



export const useCloudStorageStore = defineStore('cloudStorage', {
    state: () => ({
        webdavSessions: [],
    }),
    getters: {},
    actions: {
        findSession(url, username) {
            return this.webdavSessions.findIndex(session => {
                const { url: sUrl, realm } = session
                const sUsername = base64Parse(realm).split(':')[0]
                return url == sUrl && username == sUsername
            })
        },
        getWebDavSession(id, rawMode) {
            const index = this.webdavSessions.findIndex(session => (session.id == id))
            if(index < 0) return {}
            if(rawMode) return this.webdavSessions[index]
            
            const { title, url, realm } = this.webdavSessions[index]
            const username = base64Parse(realm).split(':')[0]
            return { id, title, url, username }
        },
        addWebDavSession(title, url, username, password){
            const index = this.findSession(url, username)
            if(index > -1) return false

            const realm = base64Stringify(`${username}:${password}`)
            this.webdavSessions.push({
                id: md5(`${username}@${url}`),
                title,
                url, 
                realm,
            })
            return true
        }, 
        updateWebDavSession(id, title, url, username) {
            const index = this.webdavSessions.findIndex(session => (session.id == id))
            if(index < 0) return false
            Object.assign(this.webdavSessions[index], { title })
            return true
        },
        removeWebDavSession({ id }) {
            const index = this.webdavSessions.findIndex(session => (session.id == id))
            if(index < 0) return false
            this.webdavSessions.splice(index, 1)
            return true
        },
        removeAllWebDavSession() {
            this.webdavSessions.length = 0
        }
    },
    persist: {
        enabled: true,
        strategies: [{
            //key: 'cloudStorage',
            storage: localStorage,
            paths:[ 'webdavSessions', ]
        }]
    }
})