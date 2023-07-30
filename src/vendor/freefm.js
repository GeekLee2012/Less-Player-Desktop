import { Lyric } from "../common/Lyric";
import { useFreeFMStore } from "../renderer/store/freeFMStore";



//TODO 自由电台，以国外为主，目前主要靠手动收集
//初衷：开启世界之门，接收不一样的信息；帮助学习外文，同时更多地了解世界
//正所谓：眼观六路，耳听八方
export class FreeFM {
    static CODE = 'freefm'

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            resolve(track)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const result = { id, platform: FreeFM.CODE, lyric: null }
            const { getFreeRadio } = useFreeFMStore()
            const radioPlaylist = getFreeRadio(id)
            if (radioPlaylist) {
                const { about } = radioPlaylist
                if (about && about.trim().length > 0) {
                    const lyric = new Lyric()
                    lyric.addLine('999:99.000', about)
                    Object.assign(result, { lyric })
                }
            }
            resolve(result)
        })
    }

}