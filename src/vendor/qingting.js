import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { hmacMd5 } from "../common/Utils";



const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

const getSign = (src) => {
    return hmacMd5(src, "fpMn12&38f_2e")
}

export class Qingting {
    static CODE = 'qingting'
    static RADIO_PREFIX = 'FM_'

    //全部分类
    static radioCategories() {
        return Qingting.anchorRadioCategories()
    }

    static radioSquare(cate, offset, limit, page, order) {
        return Qingting.anchorRadioSquare(cate, offset, limit, page, order)
    }

    static anchorRadioCategories() {
        return new Promise((resolve, reject) => {
            const url = "https://i.qingting.fm/capi/neo-channel-filter?category=545&attrs=0&curpage=1"
            getJson(url).then(json => {
                const result = { platform: Qingting.CODE, data: [], orders: [] }
                const category = new Category("分类")
                result.data.push(category)

                const list = json.data.categories
                list.forEach(item => {
                    category.add(item.name, item.id)
                })
                resolve(result)
            })
        })
    }

    static anchorRadioSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { platform: Qingting.CODE, cate, offset, limit, page, total: 0, data: [] }
            const url = "https://i.qingting.fm/capi/neo-channel-filter"
                + "?category=" + cate + "&attrs=0&curpage=" + page
            getJson(url).then(json => {
                const list = json.data.channels
                //TODO 目前每页数据 12条，后期可能会变动
                result.total = Math.ceil(json.total / 12)
                list.forEach(item => {
                    const { id, title, cover, description } = item
                    const playlist = new Playlist(Playlist.ANCHOR_RADIO_ID_PREFIX + id, Qingting.CODE, cover, title, null, description)
                    playlist.type = Playlist.ANCHOR_RADIO_TYPE
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    static playlistDetail(id, offset, limit, page) {
        return Qingting.anchorRadioDetail(id, offset, limit, page)
    }

    //详情
    static anchorRadioDetail(id, offset, limit, page) {
        id = id.toString()
        const resolveId = id.replace(Playlist.ANCHOR_RADIO_ID_PREFIX, '')
        return new Promise((resolve, reject) => {
            const url = "https://webbff.qingting.fm/www"
            const reqBody = {
                query: "{channelPage(cid:" + resolveId + ",page:" + page + ",order:\"asc\",qtId:\"null\"){\n album\n seo\n plist\n reclist\n categoryId\n categoryName\n collectionKeywords\n }\n }"
            }
            postJson(url, reqBody).then(json => {
                const { album, plist } = json.data.channelPage
                const { name, desc, detail, img_url, program_count, podcasters } = album
                const result = new Playlist(id, Qingting.CODE, img_url, name, null, desc)
                result.type = Playlist.ANCHOR_RADIO_TYPE
                result.total = program_count
                const artistName = podcasters && podcasters.length > 0 ? podcasters[0].name : ''

                plist.forEach(item => {
                    const { id, title, duration, cover, playcount, update_time } = item
                    const artist = [{ id: '', name: artistName }]
                    const album = { id: result.id, name }
                    const track = new Track(id, Qingting.CODE, title, artist, album, duration * 1000, cover)
                    track.pid = result.id
                    track.type = result.type
                    track.lyric.addLine('999:99.000', detail)
                    //track.extra1 = playcount
                    track.extra2 = update_time
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const pid = track.pid.replace(Playlist.ANCHOR_RADIO_ID_PREFIX, '')
            const ts = Date.now()
            const src = `/audiostream/redirect/${pid}/${id}?access_token=&device_id=MOBILESITE&qingting_id=&t=${ts}`
            const sign = getSign(src)
            const result = new Track(id, Qingting.CODE)
            result.url = `https://audio.qtfm.cn${src}&sign=${sign}`
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve({ id, platform: Qingting.CODE, lyric: new Lyric(), trans: null })
        })
    }

}