
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";



//TODO 自由电台，以国外为主，目前主要靠手动收集
//初衷：开启世界之门，接收不一样的信息；帮助学习外文，同时更多地了解世界
//正所谓：眼观六路，耳听八方
export class FreeFM {
    static CODE = 'freefm'
    static RADIO_PREFIX = 'FM_'

    static radioCategories() {
        return new Promise((resolve, reject) => {
            const result = { platform: FreeFM.CODE, data: [], orders: [] }
            const category = new Category("分类")
            result.data.push(category)

            category.add('全部', 'all')
            category.add('美国', 'us')
            category.add('英国', 'en')
            category.add('法国', 'fr')
            category.add('德国', 'de')
            resolve(result)
        })
    }

    static radioSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { platform: FreeFM.CODE, cate, offset, limit, page, total: 0, data: [] }
            const id = "npr-ice"
            const cover = "https://static-assets.npr.org/static/images/favicon/favicon-180x180.png"
            const playlist = new Playlist(id, FreeFM.CODE, cover, "NPR")
            playlist.type = Playlist.FM_RADIO_TYPE

            const artist = [{ id: '', name: '自由电台' }]
            const album = { id: '', name: '自由电台' }
            const channelTrack = new Track(id, playlist.platform, "NPR", artist, album, 0, cover)
            channelTrack.url = "https://npr-ice.streamguys1.com/live.mp3"
            channelTrack.type = playlist.type

            playlist.addTrack(channelTrack)

            result.data.push(playlist)
            resolve(result)
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            // NPR : https://npr-ice.streamguys1.com/live.mp3
            const result = new Track(id, FreeFM.CODE)
            result.url = "https://npr-ice.streamguys1.com/live.mp3"
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve({ id, platform: FreeFM.CODE, lyric: null })
        })
    }

}