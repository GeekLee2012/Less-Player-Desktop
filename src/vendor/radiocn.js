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

    //全部分类
    static categories() {
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
            const result = []
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                const category = new Category("分类")
                result.push(category)

                const list = json.data.category
                list.forEach(item => {
                    category.add(item.name, item.id)
                })

                RadioCN.radioCategories().then(radioCateResult => {
                    result.push(...radioCateResult.data)
                    resolve({ platform: RadioCN.CODE, data: result })
                })
                
            })
        })
    }

    //电台分类
    static radioCategories() {
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
            const result = []
            const category = new Category("电台")
            result.push(category)
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                
                const list = json.data.place
                list.forEach(item => {
                    category.add(item.name, RadioCN.RADIO_PREFIX + item.id)
                })
                resolve({ platform: RadioCN.CODE, data: result })
            })
        })
    }

    //电台分类
    static radioChannelList(cate, offset, limit, page) {
        cate = cate.replace(RadioCN.RADIO_PREFIX, '')
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, total: 0, data: [] }
            if(page > 1) {
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
                    const cover = item.icon[0].url
                    const playlist = new Playlist(item.id, RadioCN.CODE, cover, item.name, null, item.description)
                    playlist.isRadioType = true
                    playlist.isFMRadio = true
                    playlist.channel = {
                        id: item.id,
                        cover,
                        name: item.name,
                        radio: {
                            id: '',
                            rid: item.radio_id,
                            name: item.radio_name
                        },
                        url: item.streams[0].url
                    }
                    
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌单广场
    static square(cate, offset, limit, page) {
        //电台
        if(cate.startsWith(RadioCN.RADIO_PREFIX)) return RadioCN.radioChannelList(cate, offset, limit, page)
        //分类歌单
        return new Promise((resolve, reject) => {
            const url = "http://tacc.radio.cn/pcpages/categorypages"
            const ts = Date.now()
            const callback = 'jQuery19109854783215852262_' + ts
            const reqBody = {
                callback,
                per_page: 16,
                page: page,
                label_id: '',
                cate_id: cate,
                _: ts
            }
            const result = { offset, limit, page, total: 0, data: [] }
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                
                const list = json.data.odchannel
                list.forEach(item => {
                    const cover = item.imageUrl[0].url
                    const playlist = new Playlist(item.id, RadioCN.CODE, cover, item.name)
                    playlist.about = item.description
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = new Playlist()
            const url = "http://tacc.radio.cn/pcpages/odchannelpages"
            const ts = Date.now()
            const callback = 'jQuery112201019034190808098_' + ts
            const reqBody = {
                callback,
                od_id: parseInt(id),
                start: page,
                rows: limit,
                _: ts
            }
            getJson(url, reqBody).then(jsonp => {
                const json = parseJson(jsonp, callback)
                const playlist = json.data.odchannel

                result.id = playlist.id
                result.platform = RadioCN.CODE
                result.title = playlist.name
                result.cover = playlist.imageUrl[0].url
                result.about = playlist.description

                const programs = json.data.program
                programs.forEach(item => {
                    const artist = []
                    const album = { id: item.odChannelIds , name: '' }
                    const duration = parseInt(item.duration) * 1000
                    const cover = result.cover
                    const track = new Track(item.id, RadioCN.CODE, item.name, artist, album, duration, cover)
                    track.url = item.streams[0].url
                    track.lyric.addLine('00:00.000', item.description)
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
    static lyric(id) {
        return new Promise((resolve, reject) => {
            resolve(new Lyric())
        })
    }

}