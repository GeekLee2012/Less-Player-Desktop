import { AuthType, createClient } from 'webdav';
import { United } from "./united";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { emitEvents } from "../common/EventBusWrapper";
import { ipcRendererInvoke, base64Stringify, base64Parse } from "../common/Utils";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

export class WebDav {
    static CODE = 'webdav'

    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            //封面
            const onlineCandidate = await United.transferTrack(track, { isGetCover: true })
            if (onlineCandidate) {
                const { cover } = onlineCandidate
                if (cover && track.cover != cover) {
                    Object.assign(track, { cover })
                    onTrackUpdated(track)
                }
            }
            resolve(track)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            //内嵌歌词
            let lyricText = track.embeddedLyricText
            //在线歌词
            let onlineCandidate = null
            if (!lyricText) {
                onlineCandidate = await United.transferTrack(track, { isGetLyric: true })
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(track, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(track, { lyric: Lyric.parseFromText(lyricText) })
            }
            //封面，顺便更新一下
            if (!onlineCandidate || !Track.hasCover(onlineCandidate)) onlineCandidate = await United.transferTrack(track, { isGetCover: true })
            if (onlineCandidate) {
                const { cover } = onlineCandidate
                if (cover && track.cover != cover) {
                    Object.assign(track, { cover })
                    onTrackUpdated(track)
                }
            }
            resolve(track)
        })
    }

    static guessHost(url) {
        const from = url.indexOf('.') + 1
        const to = url.indexOf('/', from)
        const host = url.substring(from, to)
        return host
    }

    static setupAuthorization(session) {
        const { url, realm } = session
        const host = WebDav.guessHost(url)

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
        const { url, realm } = session
        const [ username, password ] = base64Parse(realm).split(':')
        const client = createClient(url, {
            //authType: AuthType.Digest,
            username,
            password,
        })

        WebDav.setupAuthorization(session)
        return client
    }

    static ls(client, path, options) {
        return client.getDirectoryContents(path, options)
    }

}
