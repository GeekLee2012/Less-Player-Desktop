import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toYyyymmdd } from "../common/Times";



const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

export class Ximalaya {
    static CODE = 'ximalaya'
    static RADIO_PREFIX = 'FM_'

    //全部电台分类
    static radioCategories() {
        return Ximalaya.fmRadioCategories()
    }

    static radioSquare(cate, offset, limit, page, order) {
        return Ximalaya.fmRadioSquare(cate, offset, limit, page, order)
    }

    //全部电台分类
    static fmRadioCategories() {
        return new Promise((resolve, reject) => {
            const url = "https://www.ximalaya.com/radio/"
            getDoc(url).then(doc => {
                const result = { platform: Ximalaya.CODE, data: [], orders: [], multiMode: true }
                const cateListWraps = doc.querySelectorAll(".category-list .all-wrap > .all")
                cateListWraps.forEach(wrapItem => {
                    const category = new Category()
                    result.data.push(category)
                    const list = wrapItem.querySelectorAll(".category-item")
                    list.forEach(item => {
                        const classStyle = item.getAttribute("class")
                        const name = item.getAttribute("title")
                        let value = item.getAttribute("href")
                        if (classStyle.includes('all')) {
                            category.name = name.replace('全部', '')
                            value = value.split("/")[1]
                        } else {
                            value = value.split("/")[2]
                        }
                        category.add(name, value)
                    })
                })
                resolve(result)
            })
        })
    }

    //提取电台分类
    static parseFMRadioCate(cate) {
        const result = { locationId: 0, locationTypeId: 0, categoryId: 0 }
        try {
            const VALUE_ALL = 'radio'
            //默认全部
            cate = cate || {
                '地区': {
                    item: { key: '全部', value: VALUE_ALL }
                },
                '分类': {
                    item: { key: '全部', value: VALUE_ALL }
                }
            }
            const location = cate['地区'].item.value
            const category = cate['分类'].item.value

            if (location != VALUE_ALL) {
                const value = location.substring(1)
                if (value.length > 1) {
                    result.locationId = value
                } else {
                    result.locationTypeId = value
                }
            }
            if (category != VALUE_ALL) {
                const value = category.substring(1)
                result.categoryId = value
            }
        } catch (error) {
            //console.log(error)
        }
        return result
    }

    static fmRadioSquare(cate, offset, limit, page, order) {
        const { locationId, locationTypeId, categoryId } = Ximalaya.parseFMRadioCate(cate)
        return new Promise((resolve, reject) => {
            const result = { platform: Ximalaya.CODE, cate, offset, limit, page, total: 0, data: [] }
            const pageSize = 48
            const url = "https://mobile.ximalaya.com/radio-first-page-app/search"
                + "?locationId=" + locationId + "&locationTypeId=" + locationTypeId
                + "&categoryId=" + categoryId + "&pageNum=" + page + "&pageSize=" + pageSize
            getJson(url).then(json => {
                const list = json.data.radios
                const total = json.data.total
                result.total = Math.ceil(total / pageSize)
                list.forEach(item => {
                    const { id, name, coverSmall, coverLarge, categoryName, programId, programScheduleId } = item
                    const cover = (coverLarge || coverSmall)
                    const playlist = new Playlist(id, Ximalaya.CODE, cover, name)
                    playlist.programId = programId
                    playlist.type = Playlist.FM_RADIO_TYPE

                    const artist = [{ id: '', name: '喜马拉雅FM' }]
                    const album = { id: '', name: categoryName }
                    const channelTrack = new Track(id, playlist.platform, name, artist, album, 0, cover)
                    channelTrack.url = `https://live.ximalaya.com/radio-first-page-app/live/${id}/64.m3u8?transcode=ts`
                    channelTrack.type = playlist.type

                    playlist.addTrack(channelTrack)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            /*
            const src = "/audiostream/redirect/"
                + track.pid + "/" + id
                + "?access_token=&device_id=MOBILESITE&qingting_id=&t=" + Date.now()
            const url = "https://audio.qtfm.cn" + src + "&sign=" + getSign(src)
            const result = new Track(id, Ximalaya.CODE)
            result.url = url
            */
            resolve(new Track(id, Ximalaya.CODE))
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve(resolve({ id, platform: Ximalaya.CODE, lyric: new Lyric(), trans: null }))
        })
    }

}