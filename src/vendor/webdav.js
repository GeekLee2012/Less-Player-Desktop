import { AuthType, createClient } from 'webdav';
import { United } from "./united";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { emitEvents } from "../common/EventBusWrapper";
import { ipcRendererInvoke, base64Stringify, base64Parse, transformUrl, decodeLess } from "../common/Utils";
import { useSettingStore } from "../renderer/store/settingStore";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

export class WebDav {
    static CODE = 'webdav'

    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //封面
            const { isUseOnlineCoverEnable } = useSettingStore()
            if(!Track.hasCover(result) || isUseOnlineCoverEnable) {
                const onlineCandidate = await United.transferTrack(result, { isGetCover: true })
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    if (cover && result.cover != cover) {
                        Object.assign(result, { cover })
                        onTrackUpdated(result)
                    }
                }
            }
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //内嵌歌词
            let lyricText = result.embeddedLyricText
            //在线歌词
            let onlineCandidate = null
            if (!lyricText) {
                onlineCandidate = await United.transferTrack(result, { isGetLyric: true })
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(result, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(result, { lyric: Lyric.parseFromText(lyricText) })
            }
            
            //封面
            const { isUseOnlineCoverEnable } = useSettingStore()
            if(!Track.hasCover(result) || isUseOnlineCoverEnable) {
                if (!onlineCandidate || !Track.hasCover(onlineCandidate)) {
                    onlineCandidate = await United.transferTrack(track, { isGetCover: true })
                }
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    if (cover && result.cover != cover) {
                        Object.assign(result, { cover })
                        onTrackUpdated(result)
                    }
                }
            }
            resolve(result)
        })
    }

    static guessHost(url) {
        const from = url.indexOf('.') + 1
        const to = url.indexOf('/', from)
        const host = url.substring(from, to)
        return host
    }

    static setupAuthorization(session) {
        const { url, username, password } = session
        const host = WebDav.guessHost(url)

        const _password = decodeLess(password)
        const realm = base64Stringify(`${username}:${_password}`)
        
        ipcRendererInvoke('app-addRequestHandler', {
            id: host,
            hosts: [host],
            defaultHeaders: {
                //'WWW-Authenticate': `Basic ${realm}`,
                Authorization: `Basic ${realm}`,
                _Referer: url,
            },
        })
    }

    static createClient(session) {
        const { url, username, password } = session
        const _password = decodeLess(password)
        const client = createClient(transformUrl(url), {
            //authType: AuthType.Digest,
            username,
            password: _password,
        })

        WebDav.setupAuthorization(session)
        return client
    }

    static ls(client, path, options) {
        return client.getDirectoryContents(path, options)
    }

}
