import { getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { toYyyymmdd } from "../common/Times";
import { isDevEnv, md5, toTrimString } from "../common/Utils";



const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

const secretKey = 'f0fc4c668392f9f9a447e48584c214ee'

// // 获取sign参数(使用其它参数排序后，拼接Key，转为大写MD5串)
const getParamsOrderByKey = function (params, methodType) {
    if (!methodType) methodType = 'get'
    methodType = methodType.toUpperCase()
    if (methodType === 'POST') {
        return JSON.stringify(params)
    } else {
        var sortArr = Object.keys(params).sort();
        var sortParams = [];
        var tmpKey = '';
        if (sortArr.length) {
            for (var i = 0; i < sortArr.length; i++) {
                tmpKey = sortArr[i];
                sortParams.push(tmpKey + '=' + params[tmpKey])
            }
        }
        return sortParams.join('&')
    }
}

const getSign = (tm, data, methodType) => {
    const signText = (data ? (getParamsOrderByKey(data, methodType) + '&') : '') + 'timestamp=' + tm + '&key=' + secretKey
    return md5(signText).toUpperCase()
}

const getRequestConfig = (data, methodType) => {
    methodType = methodType || 'get'
    const tm = Date.now()
    return {
        headers: {
            equipmentId: '0000',
            platformCode: 'WEB',
            timestamp: tm,
            sign: getSign(tm, data, methodType)
        }
    }
}

//央广云听
//http://www.radio.cn
export class RadioCN {
    static CODE = 'radiocn'
    static RADIO_PREFIX = 'FM_'
    static CNR_CODE = RadioCN.RADIO_PREFIX + '3225'
    static BJ_CODE = RadioCN.RADIO_PREFIX + '3226'
    static SH_CODE = RadioCN.RADIO_PREFIX + '3228'
    static JS_CODE = RadioCN.RADIO_PREFIX + '3232'
    static GD_CODE = RadioCN.RADIO_PREFIX + '3240'
    static FM_CATES_CACHE = []

    //全部分类
    static categories_v0() {
        return new Promise(async (resolve, reject) => {
            const result = { platform: RadioCN.CODE, data: [], orders: [] }

            const p1 = RadioCN.anchorRadioCategories()
            const p2 = RadioCN.fmRadioCategories()
            Promise.all([p1, p2]).then(values => {
                const anchorRadioCategories = values[0]
                const fmRadioCategories = values[1]

                const defaultCategory = new Category("推荐")
                defaultCategory.add('国家电台', RadioCN.CNR_CODE)
                //defaultCategory.add('北京', RadioCN.BJ_CODE)
                //defaultCategory.add('上海', RadioCN.SH_CODE)
                defaultCategory.add('江苏电台', RadioCN.JS_CODE)
                defaultCategory.add('广东电台', RadioCN.GD_CODE)
                result.data.push(defaultCategory)
                result.data.push(...anchorRadioCategories.data)
                result.data.push(...fmRadioCategories.data)
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const result = { platform: RadioCN.CODE, data: [], orders: [], multiMode: true }
            RadioCN.fmRadioCategories().then(cates => {
                if (cates.data.length > 0) {
                    result.data.push(...cates.data)
                }
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //电台分类
    static fmRadioCategories_v0() {
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

    static fmRadioCategories() {
        return new Promise(async (resolve, reject) => {
            let url = "https://ytmsout.radio.cn/web/appProvince/list/all"
            const result = { platform: RadioCN.CODE, data: [] }
            const provincesResult = await getJson(url, null, getRequestConfig())
            if (provincesResult && provincesResult.data) {
                const provincesCate = new Category('地区')
                result.data.push(provincesCate)

                provincesResult.data.forEach(item => {
                    const { provinceName, provinceCode } = item
                    provincesCate.add(provinceName, provinceCode)
                })
            }
            url = "https://ytmsout.radio.cn/web/appCategory/list/all"
            const typesResult = await getJson(url, null, getRequestConfig())
            if (typesResult && typesResult.data) {
                const typesCate = new Category('类型')
                result.data.push(typesCate)

                typesResult.data.forEach(item => {
                    const { categoryName, id } = item
                    typesCate.add(categoryName, id)
                })
            }
            if (result.data.length > 0) {
                RadioCN.FM_CATES_CACHE.length = 0
                RadioCN.FM_CATES_CACHE.push(...result.data)
            }
            resolve(result)
        })
    }

    static randomCate() {
        let provinceCode = 0, provinceName = '国家'
        let typeId = 0, typeName = '全部'
        const cacheCates = RadioCN.FM_CATES_CACHE
        if (cacheCates.length > 0) {
            const { data: provinces } = cacheCates[0]
            const index = parseInt(Math.random() * (provinces.length - 1))
            provinceCode = provinces[index].value
            provinceName = provinces[index].key
        }
        return {
            '地区': {
                item: { key: provinceName, value: provinceCode }
            },
            '类型': {
                item: { key: typeName, value: typeId }
            }
        }
    }

    static parseFmRadioCate(cate) {
        cate = cate || RadioCN.randomCate()
        return {
            provinceCode: cate['地区'].item['value'],
            provinceName: cate['地区'].item['key'],
            categoryId: cate['类型'].item['value'],
            categoryName: cate['类型'].item['key'],
        }
    }

    //广播电台
    static fmRadioSquare(cate, offset, limit, page, order) {
        const result = { platform: RadioCN.CODE, cate, offset, limit, page, total: 1, data: [] }
        const parsedCate = RadioCN.parseFmRadioCate(cate)
        const { provinceCode, provinceName, categoryId, categoryName } = parsedCate
        return new Promise((resolve, reject) => {
            if (page > 1) {
                resolve(result)
                return
            }
            const data = { categoryId, provinceCode }
            const url = "https://ytmsout.radio.cn/web/appBroadcast/list"
            getJson(url, data, getRequestConfig(data)).then(json => {
                const list = json.data
                list.forEach(item => {
                    const { contentId: id, title, image: cover, mp3PlayUrlHigh, mp3PlayUrlLow, playUrlLow, playUrlMulti } = item
                    const playlist = new Playlist(id, RadioCN.CODE, cover, title)
                    playlist.type = Playlist.FM_RADIO_TYPE

                    const artist = [{ id: '', name: '央广云听' }]
                    const albumName = `${provinceName} - ${categoryName}`.replace(' - 全部', '')
                    const album = { id: '', name: albumName }
                    const channelTrack = new Track(id, playlist.platform, title, artist, album)
                    channelTrack.cover = cover
                    channelTrack.url = playUrlMulti || playUrlLow
                    channelTrack.type = playlist.type
                    channelTrack.position = RadioCN.stringifyPosition(parsedCate, offset, limit, page, order)

                    playlist.addTrack(channelTrack)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //全部电台
    static square(cate, offset, limit, page, order) {
        return RadioCN.fmRadioSquare(cate, offset, limit, page, order)
    }

    //全部：电台、歌单（节目播单）
    static square_v0(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || "").toString().trim()
        //resolvedCate = resolvedCate.length < 1 ? RadioCN.CNR_CODE : resolvedCate
        //电台
        if (typeof (cate) == 'object') return RadioCN.fmRadioSquare(cate, offset, limit, page, order)
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
                const { odchannel: playlist, program: programs } = json.data

                const { name, imageUrl, description } = playlist
                const { url: cover } = imageUrl[0]
                const result = new Playlist(id, RadioCN.CODE, cover, name, null, description)
                result.type = Playlist.ANCHOR_RADIO_TYPE
                result.total = json.total

                programs.forEach(item => {
                    const artist = [{ id: '', name: '央广云听' }]
                    const album = { id, name }
                    const duration = parseInt(item.duration) * 1000
                    const cover = result.cover
                    const tid = item.id || item.programId
                    const track = new Track(tid, RadioCN.CODE, item.name, artist, album, duration, cover)
                    track.url = item.downloadUrl || item.streams[0].url
                    track.lyric.addLine('999:99.000', item.description || description)
                    track.type = result.type
                    track.extra1 = '&nbsp;'
                    track.extra2 = item.onlinetime
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    static stringifyPosition(cate, offset, limit, page, order) {
        const { provinceCode, provinceName, categoryId, categoryName } = cate
        return `${provinceCode},${provinceName};${categoryId},${categoryName};${offset};${limit};${page};${order || ''}`
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
            const [province, category, offset, limit, page, order] = position.split(';')
            const [provinceCode, provinceName] = province.split(',')
            const [categoryId, categoryName] = category.split(',')
            const cate = {
                '地区': {
                    item: {
                        key: provinceName,
                        value: provinceCode
                    }
                },
                '类型': {
                    item: {
                        key: categoryName,
                        value: categoryId
                    }
                }
            }
            return { cate, offset, limit, page, order }
        } catch (error) {
            if (isDevEnv()) console.log(error)
        }
        return null
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const { position } = track
            //由于url存在时效，可能会过期
            if (position) {
                const pPosition = RadioCN.parsePosition(position)
                if (!pPosition) {
                    return resolve(track)
                }
                const { cate, offset, limit, page, order } = pPosition
                const radiosResult = await RadioCN.fmRadioSquare(cate, offset, limit, page, order)
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
            resolve(resolve({ id, platform: RadioCN.CODE, lyric: null, trans: null }))
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