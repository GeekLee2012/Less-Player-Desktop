import { getDoc, getJson, } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toTrimString } from "../common/Utils";



const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

export class Ximalaya {
    static CODE = 'ximalaya'
    static RADIO_PREFIX = 'FM_'
    static VALUE_ALL = 'all'

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
                            value = Ximalaya.VALUE_ALL
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
        const result = { locationId: 0, locationTypeId: 0, categoryId: 0, location: null, category: null }
        try {
            const valueAll = Ximalaya.VALUE_ALL
            //默认全部
            cate = cate || {
                '地区': {
                    item: { key: '全部', value: valueAll }
                },
                '分类': {
                    item: { key: '全部', value: valueAll }
                }
            }
            const location = cate['地区'].item.value
            const category = cate['分类'].item.value

            Object.assign(result, { location, category })

            if (location != valueAll) {
                const value = location.substring(1)
                //格式: c110000
                if (value.length > 1) {
                    result.locationId = value
                } else {
                    result.locationTypeId = value
                }
            }
            if (category != valueAll) {
                const value = category.substring(1)
                result.categoryId = value
            }
        } catch (error) {
            //console.log(error)
        }
        return result
    }

    static fmRadioSquare(cate, offset, limit, page, order) {
        const parsedCate = Ximalaya.parseFMRadioCate(cate)
        const { location, locationId, locationTypeId, categoryId, category } = parsedCate
        return new Promise((resolve, reject) => {
            const result = { platform: Ximalaya.CODE, cate, offset, limit, page, total: 0, data: [] }
            const pageSize = 48
            const url = "https://mobile.ximalaya.com/radio-first-page-app/search"
                + `?locationId=${locationId}&locationTypeId=${locationTypeId}`
                + `&categoryId=${categoryId}&pageNum=${page}&pageSize=${pageSize}`
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
                    const album = { id: `${locationTypeId}-${locationId}`, name: categoryName }
                    const channelTrack = new Track(id, playlist.platform, name, artist, album, 0, cover)
                    channelTrack.url = `https://live.ximalaya.com/radio-first-page-app/live/${id}/64.m3u8?transcode=ts`
                    channelTrack.type = playlist.type
                    channelTrack.position = Ximalaya.stringifyPosition({ location, category, categoryName }, offset, limit, page, order)

                    playlist.addTrack(channelTrack)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    static stringifyPosition(cate, offset, limit, page, order) {
        const { location, categoryName, category } = cate
        return `${location};${category};${categoryName};${offset};${limit};${page};${order || ''}`
    }

    static parsePosition(position) {
        try {
            if (position && typeof (position) == 'object') {
                const props = Object.keys(position)
                if (!props.includes('cate') || !props.includes('offset')
                    || !props.includes('limit') || !props.includes('page')) {
                    return null
                }
                return position
            }
            const [location, category, categoryName, offset, limit, page, order] = position.split(';')
            const cate = {
                '地区': {
                    item: {
                        key: location,
                        value: location
                    }
                },
                '分类': {
                    item: {
                        key: categoryName,
                        value: category
                    }
                }
            }
            return { cate, offset, limit, page, order }
        } catch (error) {
            if (isDevEnv()) console.log(error)
        }
        return null
    }

    //歌曲播放详情：url、cover等
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const { position } = track
            //由于url存在时效，可能会过期
            if (position) {
                const pPosition = Ximalaya.parsePosition(position)
                if (!pPosition) {
                    return resolve(track)
                }
                const { cate, offset, limit, page, order } = pPosition
                const radiosResult = await Ximalaya.fmRadioSquare(cate, offset, limit, page, order)
                if (radiosResult && radiosResult.data.length > 0) {
                    for (let i = 0; i < radiosResult.data.length; i++) {
                        const radioPlaylist = radiosResult.data[i]
                        if (toTrimString(id) == toTrimString(radioPlaylist.id)
                            && radioPlaylist.data && radioPlaylist.data.length > 0) {
                            const { url } = radioPlaylist.data[0]
                            Object.assign(track, { url })
                            break
                        }
                    }
                }
            }
            resolve(track)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve(resolve({ id, platform: Ximalaya.CODE, lyric: new Lyric(), trans: null }))
        })
    }

}