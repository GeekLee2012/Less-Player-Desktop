import { getDoc, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toYyyymmdd } from "../common/Times";



const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

//央广云听
//http://www.radio.cn
export class RadioCN {
    static CODE = 'radiocn'
    static RADIO_PREFIX = 'FM_'
    static CNR_CODE = RadioCN.RADIO_PREFIX + '3225'

    //全部分类
    static categories() {
        return new Promise(async (resolve, reject) => {
            const result = { platform: RadioCN.CODE, data: [], orders: [] }

            const p1 = RadioCN.anchorRadioCategories()
            const p2 = RadioCN.fmRadioCategories()
            Promise.all([p1, p2]).then(values => {
                const anchorRadioCategories = values[0]
                const fmRadioCategories = values[1]

                const defaultCategory = new Category("默认")
                defaultCategory.add('国家电台', RadioCN.CNR_CODE)
                result.data.push(defaultCategory)
                result.data.push(...anchorRadioCategories.data)
                result.data.push(...fmRadioCategories.data)
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //电台分类
    static fmRadioCategories() {
        return new Promise((resolve, reject) => {
            const url = "http://tacc.radio.cn/pcpages/radiopages"
            const ts = Date.now()
            const callback = 'jQuery112208803652938521349_' + ts
            const reqBody = {
                callback,
                place_id: 1,
                channel_id: 1,
                date: '',
                _: ts
            }
            const result = { platform: RadioCN.CODE, data: [] }
            const category = new Category("电台")
            result.data.push(category)
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)

                const list = json.data.place
                list.forEach(item => {
                    category.add(item.name, RadioCN.RADIO_PREFIX + item.id)
                })
                resolve(result)
            })
        })
    }

    //广播电台
    static fmRadioSquare(cate, offset, limit, page, order) {
        const result = { platform: RadioCN.CODE, cate, offset, limit, page, total: 1, data: [] }
        cate = cate.replace(RadioCN.RADIO_PREFIX, '')
        return new Promise((resolve, reject) => {
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "http://tacc.radio.cn/pcpages/radiopages"
            const ts = Date.now()
            const callback = 'jQuery112208803652938521349_' + ts
            const reqBody = {
                callback,
                place_id: cate,
                channel_id: 1,
                date: toYyyymmdd(ts),
                _: ts
            }
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                const list = json.data.top
                list.forEach(item => {
                    const { id, name, radio_id, radio_name, icon, streams, description } = item
                    const cover = icon[0].url
                    const playlist = new Playlist(id, RadioCN.CODE, cover, name, null, description)
                    playlist.type = Playlist.FM_RADIO_TYPE

                    const artist = [{ id: '', name: '央广云听' }]
                    const album = { id: '', name: radio_name }
                    const channelTrack = new Track(id, playlist.platform, name, artist, album)
                    channelTrack.cover = cover
                    channelTrack.url = streams[0].url
                    channelTrack.type = playlist.type

                    playlist.addTrack(channelTrack)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //全部
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || "").toString().trim()
        resolvedCate = resolvedCate.length < 1 ? RadioCN.CNR_CODE : resolvedCate
        //电台
        if (resolvedCate.startsWith(RadioCN.RADIO_PREFIX)) return RadioCN.fmRadioSquare(resolvedCate, offset, limit, page, order)
        //分类歌单
        return new Promise((resolve, reject) => {
            const result = { platform: RadioCN.CODE, cate: originCate, offset, limit, page, total: 0, data: [] }
            const url = "http://tacc.radio.cn/pcpages/categorypages"
            const ts = Date.now()
            const callback = 'jQuery19109854783215852262_' + ts
            const reqBody = {
                callback,
                per_page: 16,
                page: page,
                label_id: '',
                cate_id: resolvedCate,
                _: ts
            }

            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                result.total = json.data.total_page
                const list = json.data.odchannel
                list.forEach(item => {
                    const { id, imageUrl, name, description } = item
                    const cover = imageUrl[0].url
                    const playlist = new Playlist(Playlist.ANCHOR_RADIO_ID_PREFIX + id, RadioCN.CODE, cover, name, null, description)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //TODO 歌单详情
    static playlistDetail(id, offset, limit, page) {
        const resolveId = id.replace(Playlist.ANCHOR_RADIO_ID_PREFIX, '')
        return new Promise((resolve, reject) => {
            const url = "http://tacc.radio.cn/pcpages/odchannelpages"
            const ts = Date.now()
            const callback = 'jQuery112201019034190808098_' + ts
            const reqBody = {
                callback,
                od_id: parseInt(resolveId),
                start: page,
                rows: limit,
                _: ts
            }
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)

                const playlist = json.data.odchannel
                const { name, imageUrl, description } = playlist
                const cover = imageUrl[0].url
                const result = new Playlist(id, RadioCN.CODE, cover, name, null, description)
                result.type = Playlist.ANCHOR_RADIO_TYPE
                result.total = json.total

                const programs = json.data.program
                programs.forEach(item => {
                    const artist = []
                    const album = { id, name }
                    const duration = parseInt(item.duration) * 1000
                    const cover = result.cover
                    const tid = item.id || item.programId
                    const track = new Track(tid, RadioCN.CODE, item.name, artist, album, duration, cover)
                    track.url = item.downloadUrl || item.streams[0].url
                    track.lyric.addLine('999:99.000', item.description || description)
                    track.type = result.type
                    track.extra2 = item.onlinetime
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }


    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            resolve(track)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve(resolve({ id, platform: RadioCN.CODE, lyric: new Lyric(), trans: null }))
        })
    }

    //全部电台分类
    static radioCategories() {
        return RadioCN.categories()
    }

    //全部电台
    static radioSquare(cate, offset, limit, page, order) {
        return RadioCN.square(cate, offset, limit, page, order)
    }

    //主播电台
    static anchorRadioCategories() {
        return new Promise((resolve, reject) => {
            const url = "http://tacc.radio.cn/pcpages/categorypages"
            const ts = Date.now()
            const callback = 'jQuery1910629327131166708_' + ts
            const reqBody = {
                callback,
                per_page: 16,
                page: 1,
                label_id: '',
                cate_id: '',
                _: ts
            }
            const result = { platform: RadioCN.CODE, data: [], orders: [] }

            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                const category = new Category("分类")
                result.data.push(category)

                const list = json.data.category
                list.forEach(item => {
                    category.add(item.name, item.id)
                })
                resolve(result)
            })
        })
    }

    //主播电台
    static anchorRadioSquare(cate, offset, limit, page, order) {
        return RadioCN.square(cate, offset, limit, page, order)
    }

}