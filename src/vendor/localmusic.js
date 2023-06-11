import { Lyric } from "../common/Lyric"
import { Track } from "../common/Track"
import { useIpcRenderer } from "../common/Utils"
import { FILE_PREFIX } from "../common/Constants"
import { United } from "./united"



const ipcRenderer = useIpcRenderer()

export class LocalMusic {
    static CODE = 'local'

    //歌曲详情
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = new Track(id, LocalMusic.CODE)
            //修正url
            let url = track.url
            if (!url.includes(FILE_PREFIX)) Object.assign(result, { url: (FILE_PREFIX + url) })
            //封面
            if (!Track.hasCover(track)) {
                const onlineCandidate = await United.transferTrack(track, true)
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    Object.assign(result, { cover })
                }
            }
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { id, platform: LocalMusic.CODE, lyric: null, trans: null }
            //内嵌歌词
            let lyricText = track.embeddedLyricText
            //本地歌词（同名文件）
            try {
                if (!lyricText && ipcRenderer) {
                    lyricText = await ipcRenderer.invoke('lyric-load', track.url)
                }
            } catch (error) {
                console.log(error)
            }
            let onlineCandidate = null
            //在线歌词
            if (!lyricText) {
                onlineCandidate = await United.transferTrack(track, true, true)
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(result, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(result, { lyric: Lyric.parseFromText(lyricText) })
            }
            //封面，顺便更新一下
            if (!Track.hasCover(track)) {
                if (!onlineCandidate) onlineCandidate = await United.transferTrack(track, true, true)
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    Object.assign(track, { cover })
                }
            }
            resolve(result)
        })
    }

}