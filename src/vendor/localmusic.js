import { Lyric } from "../common/Lyric"

const ipcRenderer = electronApi.ipcRenderer

const FILE_PREFIX = 'file:///'

export class LocalMusic {
    static CODE = 'local'

    //歌曲详情
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            let url = track.url
            if(!url.includes(FILE_PREFIX)) {
                track.url = FILE_PREFIX + url
            }
            resolve(track)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            try {
                let url = track.url
                if(url.includes(FILE_PREFIX)) {
                    url = url.replace(FILE_PREFIX, '')
                }
                console.log('load-lyric: ' + url)
                const text = await ipcRenderer.invoke('lyric-load', url)
                const result = Lyric.parseFromText(text)
                resolve(result)
            } catch(error) {
                console.log(error)
                resolve(null)
            }
        })
    }

}