import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toYyyymmdd } from "../common/Times";
import CryptoJS from 'crypto-js';


const parseJson = (jsonp, callbackName) => {
    jsonp = jsonp.split(callbackName + '(')[1].trim()
    return JSON.parse(jsonp.substring(0, jsonp.length - 1))
}

const getSign = (src) => {
    return CryptoJS.HmacMD5(src, "fpMn12&38f_2e").toString()
}

export class Ximalaya {
    static CODE = 'ximalaya'
    static RADIO_PREFIX = 'FM_'

    //全部分类
    static anchorRadioCategories() {
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
                        if(classStyle.includes('all')) {
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

    //提取分类
    static parseAnchorRadioCate(cate) {
        const result = { locationId: 0, locationTypeId: 0, categoryId: 0 }
        try {
            const location = cate['地区'].item.value
            const category = cate['分类'].item.value
            const VALUE_ALL = 'radio'
            if(location != VALUE_ALL) {
                const value = location.substring(1)
                if(value.length > 1) {
                    result.locationId = value
                } else {
                    result.locationTypeId = value
                }
            }
            if(category != VALUE_ALL) {
                const value = category.substring(1)
                result.categoryId = value
            }
        } catch (e) {
            //console.log(e)
        }
        return result
    }

    static anchorRadioSquare(cate, offset, limit, page, order) {
        const { locationId, locationTypeId, categoryId } = Ximalaya.parseAnchorRadioCate(cate)
        return new Promise((resolve, reject) => {
            const result = { platform: Ximalaya.CODE, cate, offset, limit, page, total: 0, data: [] }
            const url = "https://mobile.ximalaya.com/radio-first-page-app/search" 
                + "?locationId=" + locationId + "&locationTypeId=" + locationTypeId 
                + "&categoryId=" + categoryId + "&pageNum=" + page + "&pageSize=48"
            getJson(url).then(json => {
                const list = json.data.radios
                list.forEach(item => {
                    const { id, name, coverSmall, coverLarge, categoryName, programId, programScheduleId } = item
                    const cover = (coverLarge || coverSmall)
                    const playlist = new Playlist(id, Ximalaya.CODE, cover, name, null)
                    playlist.programId = programId
                    playlist.type = Playlist.FM_RADIO_TYPE

                    const artist = [ { id:'', name: '喜马拉雅FM' } ]
                    const album = { id:'', name: categoryName }
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

    static playlistDetail(id, offset, limit, page) {
        return Ximalaya.anchorRadioDetail(id, offset, limit, page)
    }

    //详情
    static anchorRadioDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = new Playlist(id, Ximalaya.CODE)
            const url = "https://webbff.qingting.fm/www"
            const reqBody = {
                query: "{channelPage(cid:" + id + ",page:" + page +",order:\"asc\",qtId:\"null\"){\n album\n seo\n plist\n reclist\n categoryId\n categoryName\n collectionKeywords\n }\n }"
            }
            postJson(url, reqBody).then(json => {
                const album = json.data.channelPage.album
                const plist = json.data.channelPage.plist

                const { name, desc, detail, img_url, program_count } = album
                result.cover = img_url
                result.title = name
                result.about = desc
                result.total = program_count

                plist.forEach(item => {
                    const { id, title, duration, cover, playcount, update_time } = item
                    const track = new Track(id, Ximalaya.CODE, title, null, null, duration * 1000, cover)
                    track.pid = result.id
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
            const src = "/audiostream/redirect/" 
                + track.pid + "/" + id 
                + "?access_token=&device_id=MOBILESITE&qingting_id=&t=" + Date.now()
            const url = "https://audio.qtfm.cn" + src + "&sign=" + getSign(src)
            const result = new Track(id, Ximalaya.CODE)
            result.url = url
            resolve(result)  
        })
    }

    //歌词
    static lyric(id) {
        return new Promise((resolve, reject) => {
            resolve(new Lyric())
        })
    }

}