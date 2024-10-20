import { defineStore } from "pinia";
import { base64Stringify, base64Parse, md5, randomTextWithinAlphabetNums, toLowerCaseTrimString, toTrimString } from "../../common/Utils";



export const useCloudStorageStore = defineStore('cloudStorage', {
    state: () => ({
        webdavSessions: [],
        navidromeSessions: [],
    }),
    getters: {},
    actions: {
        findWebDavSession(url, username) {
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
        addWebDavSession(title, url, username, password) {
            title = toTrimString(title)
            url = toTrimString(url)
            username = toTrimString(username)
            password = toTrimString(password)
            url = url.endsWith('/') ? url : `${url}/`

            const index = this.findWebDavSession(url, username)
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
        },
        findNavidromeSession(url, username) {
            return this.navidromeSessions.findIndex(session => {
                const { url: sUrl, username: sUsername } = session
                return url == sUrl && username == sUsername
            })
        },
        getNavidromeSession(id) {
            const index = this.navidromeSessions.findIndex(session => (session.id == id))
            return index < 0 ? { id } : this.navidromeSessions[index]
        },
        addNavidromeSession(title, url, username, password){
            title = toTrimString(title)
            username = toTrimString(username)
            password = toTrimString(password)
            url = toTrimString(url)
            url = url.endsWith('/') ? url : `${url}/`

            const index = this.findWebDavSession(url, username)
            if(index > -1) return false

            const salt = randomTextWithinAlphabetNums(8)
            const token = toLowerCaseTrimString(md5(`${password}${salt}`))
            this.navidromeSessions.push({
                id: md5(`${username}@${url}`),
                title,
                url, 
                username,
                token,
                salt,
            })
            return true
        }, 
        updateNavidromeSession(id, title, url, username) {
            title = toTrimString(title)
            username = toTrimString(username)
            url = toTrimString(url)
            url = url.endsWith('/') ? url : `${url}/`

            const index = this.navidromeSessions.findIndex(session => (session.id == id))
            if(index < 0) return false
            Object.assign(this.navidromeSessions[index], { title, url, username })
            return true
        },
        removeNavidromeSession({ id }) {
            const index = this.navidromeSessions.findIndex(session => (session.id == id))
            if(index < 0) return false
            this.navidromeSessions.splice(index, 1)
            return true
        },
        removeAllNavidromeSession() {
            this.navidromeSessions.length = 0
        }
    },
    persist: {
        enabled: true,
        strategies: [{
            //key: 'cloudStorage',
            storage: localStorage,
            paths:[ 'webdavSessions', 'navidromeSessions' ]
        }]
    }
})