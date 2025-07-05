import { defineStore } from "pinia";
import { md5, randomTextWithinAlphabetNums, toLowerCaseTrimString, 
    toTrimString, encodeLess, 
} from "../../common/Utils";



export const useCloudStorageStore = defineStore('cloudStorage', {
    state: () => ({
        webdavSessions: [],
        navidromeSessions: [],
        jellyfinSessions: [],
        embySessions: [],
    }),
    getters: {},
    actions: {
        resolveUrl(url) {
            let _url = toTrimString(url)
            _url = _url.endsWith('/') ? _url : `${_url}/`
            return _url
        },
        findSessionIndex(id, sessions) {
            if(!id || !sessions) return -1
            return sessions.findIndex(session => (session.id == id))
        },
        getSession(id, sessions) {
            if(!id || !sessions) return { }
            const index = sessions.findIndex(session => (session.id == id))
            if(index < 0) return { }
            return sessions[index] || {}
        },
        removeSession(session, sessions) {
            if(!session || !sessions) return
            const { id } = session
            const index = this.findSessionIndex(id, sessions)
            if(index < 0) return false
            sessions.splice(index, 1)
            return true
        },
        getWebDavSession(id) {
            return this.getSession(id, this.webdavSessions)
        },
        addWebDavSession(title, url, username, password) {
            title = toTrimString(title)
            url = this.resolveUrl(url)
            username = toTrimString(username)
            password = encodeLess(toTrimString(password))

            const id = md5(`${username}@${url}`)
            const index = this.findSessionIndex(id, this.webdavSessions)
            if(index > -1) return false

            //const realm = base64Stringify(`${username}:${password}`)
            this.webdavSessions.push({
                id,
                title,
                url, 
                username,
                password,
            })
            return true
        }, 
        updateWebDavSession(id, title, url) {
            const index = this.findSessionIndex(id, this.webdavSessions)
            if(index < 0) return false
            Object.assign(this.webdavSessions[index], { title })
            return true
        },
        removeWebDavSession(session) {
            return this.removeSession(session, this.webdavSessions)
        },
        removeAllWebDavSession() {
            this.webdavSessions.length = 0
        },
        getNavidromeSession(id) {
            return this.getSession(id, this.navidromeSessions)
        },
        addNavidromeSession(title, url, username, password){
            title = toTrimString(title)
            url = this.resolveUrl(url)
            username = toTrimString(username)
            password = toTrimString(password)

            const id = md5(`${username}@${url}`)
            const index = this.findSessionIndex(id, this.navidromeSessions)
            if(index > -1) return false

            const salt = randomTextWithinAlphabetNums(8)
            const token = encodeLess(toLowerCaseTrimString(md5(`${password}${salt}`)))
            this.navidromeSessions.push({
                id,
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
            url = this.resolveUrl(url)

            const index = this.findSessionIndex(id, this.navidromeSessions)
            if(index < 0) return false
            Object.assign(this.navidromeSessions[index], { title, url, username })
            return true
        },
        removeNavidromeSession(session) {
            return this.removeSession(session, this.navidromeSessions)
        },
        removeAllNavidromeSession() {
            this.navidromeSessions.length = 0
        },
        getJellyfinSession(id) {
            return this.getSession(id, this.jellyfinSessions)
        },
        addJellyfinSession(title, url, username, password, apiKey){
            title = toTrimString(title)
            username = toTrimString(username)
            url = this.resolveUrl(url)
            password = encodeLess(toTrimString(password))
            apiKey = encodeLess(toTrimString(apiKey))

            const id = md5(`${username}@${url}`)
            const index = this.findSessionIndex(id, this.jellyfinSessions)
            if(index > -1) return false

            this.jellyfinSessions.push({
                id,
                title,
                url, 
                username,
                password,
                apiKey,
            })
            return true
        }, 
        updateJellyfinSession(id, title, url) {
            title = toTrimString(title)
            url = this.resolveUrl(url)

            const index = this.findSessionIndex(id, this.jellyfinSessions)
            if(index < 0) return false
            Object.assign(this.jellyfinSessions[index], { title, url })
            return true
        },
        removeJellyfinSession(session) {
            return this.removeSession(session, this.jellyfinSessions)
        },
        removeAllJellyfinSession() {
            this.jellyfinSessions.length = 0
        },
        getEmbySession(id) {
            return this.getSession(id, this.embySessions)
        },
        addEmbySession(title, url, username, password, apiKey){
            title = toTrimString(title)
            url = this.resolveUrl(url)
            username = toTrimString(username)
            password = encodeLess(toTrimString(password))
            apiKey = encodeLess(toTrimString(apiKey))

            const id = md5(`${username}@${url}`)
            const index = this.findSessionIndex(id, this.embySessions)
            if(index > -1) return false

            this.embySessions.push({
                id,
                title,
                url, 
                username,
                password,
                apiKey,
            })
            return true
        }, 
        updateEmbySession(id, title, url) {
            title = toTrimString(title)
            url = this.resolveUrl(url)

            const index = this.findSessionIndex(id, this.embySessions)
            if(index < 0) return false
            Object.assign(this.embySessions[index], { title, url })
            return true
        },
        removeEmbySession(session) {
            return this.removeSession(session, this.embySessions)
        },
        removeAllEmbySession() {
            this.embySessions.length = 0
        },
    },
    persist: {
        enabled: true,
        strategies: [{
            //key: 'cloudStorage',
            storage: localStorage,
            paths:[ 'webdavSessions', 'navidromeSessions', 'jellyfinSessions', 'embySessions', ]
        }]
    }
})