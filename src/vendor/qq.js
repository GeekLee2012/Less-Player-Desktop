import { getDoc, getJson, getRaw, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";
import CryptoJS from 'crypto-js';

//@param ignore 是否忽略&字符
const escapeHtml = (text, ignore) => {
    const regex = ignore ? (/#\d+;/g) : (/[&]#\d+;/g)
    return text.replace(regex, '')
            .replace(/&apos;/g, "'")
}

const CONFIG = {
    withCredentials: true
}

const moduleReq = (module, method, param) => {
    return { module,  method, param }
}

const getAlbumCover = (albummid) => {
    if(!albummid) return null
    return "https://y.qq.com/music/photo_new/T002R500x500M000" 
        + albummid + ".jpg?max_age=2592000"
}

const vkeyReqData = (trackInfo) => {
    //TODO
    const mediaId = trackInfo.mid
    const filename = 'C400' + mediaId + mediaId + '.m4a'
    const guid = (Math.random() * 10000000).toFixed(0);
    const uin = "0"
    return {
        comm: {
            uin,
            format: 'json',
            ct: 24,
            cv: 0
        },
        req_1: moduleReq('vkey.GetVkeyServer', 'CgiGetVkey', 
        {
            filename: [ filename ],
            guid,
            songmid: [ mediaId ],
            songtype: [ trackInfo.type ],
            uin,
            loginflag: 1,
            platform: "20"
        })
    }
}

const vkeyReqBody = (trackInfo) => {
    return {
        '-': 'getplaysongvkey',
        'g_tk': 5381,
        loginUin: 0,
        hostUin: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 1,
        platform: 'yqq.json',
        needNewCode: 0,
        data: JSON.stringify(vkeyReqData(trackInfo))
    }
}

const lyricReqBody = (id) => {
    return {
        songmid: id,
        pcachetime: Date.now(),
        g_tk: 5381,
        loginUin: 0,
        hostUin: 0,
        format:'json',
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 0,
        platform: 'yqq',
        needNewCode: 0
    }
}

const artistHotSongReqBody = (id, offset, limit) => {
    return { 
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('music.web_singer_info_svr', 'get_singer_detail_info', {
                sort: 5,
                singermid: id,
                sin:  offset,
                num: limit
            })
        })
    }
}

const artistAlbumReqBody = (id, offset, limit) => {
    return {
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('music.web_singer_info_svr', 'get_singer_album',
            {
                singermid: id,
                order: "time",
                begin: offset,
                num: limit,
                exstatus: 1
            })
        })
    }
}

const albumAllSongsReqBody = (id, offset, limit) => {
    return {
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 10000
            },
            req_1: moduleReq('music.musichallAlbum.AlbumSongList', 'GetAlbumSongList',
            {
                albumMid: id,
                albumID: 0,
                begin: offset,
                num: limit,
                order: 2
            })
        })
    }
}

const searchParam = (keyword, type, offset, limit, page) => {
    const types = {
        0: 'song',
        2: 'songlist',
        7: 'lyric',
        8: 'album',
        9: 'singer',
        12: 'mv'
    }
    keyword = keyword ? keyword.trim() : ''
    return {
        format: 'json',
        n: limit,   
        p: page,
        w: keyword,
        cr: 1,      //未知参数，但是加上此参数搜索结果更令人满意
        g_tk: 5381,
        t: type
    }
}

const topListReqBody = () => {
    return {
        _: Date.now(),
        uin: 0,
        format: 'json',
        inCharset: "utf8",
        outCharset: "utf8",
        notice: 0,
        platform: "yqq.json",
        needNewCode: 1,
        g_tk: 5381,
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('musicToplist.ToplistInfoServer', 'GetAll', {})
        })
    }
}

const topListDetailReqBody = (id, offset, limit, page) => {
    return {
        g_tk: 5381,
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('musicToplist.ToplistInfoServer', 'GetDetail',
            {
                topid: id,
                offset,
                num: 100,
                period: getPerid(id)
            })
        })
    }
}

const radioListReqBody = () => {
    return {
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 0,
        platform: 'yqq.json',
        needNewCode: 1,
        loginUin: 0,
        hostUin: 0,
        g_tk: 5381,
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('pf.radiosvr', 'GetRadiolist', { ct: 24 })
        })
    }
}

const radioSonglistReqBody = (id, firstplay) => {
    if(typeof(id) == 'string') id = parseInt(id.trim())
    return {
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 0,
        platform: 'yqq.json',
        needNewCode: 1,
        loginUin: 0,
        hostUin: 0,
        g_tk: 5381,
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            req_1: moduleReq('pf.radiosvr', 'GetRadiosonglist', 
            {
                id,
                firstplay, //数字：0或1
                num: 10
            })
        })
    }
}

//TODO 目前部分周期计算不准确
/* 获取更新周期 */
const getPerid = (id) => {
    const date = new Date()
    const yyyy = date.getFullYear()
    let mm = date.getMonth() + 1
    let dd = date.getDate()
    const day = date.getDay()
    mm = mm < 10 ? ('0' + mm) : mm
    const d0 = dd < 10 ? ('0' + dd) : dd
    let period = yyyy + "-" + mm + "-" + d0
    let week = 1
    //默认每天
    switch (id) {
        //每天
        case 27:
        case 62:
            break
        //每周几?
        case 4:
        case 52:
        case 67:
            let d2 = day < 6 ? (dd - day + 1): dd
            d2 = d2 < 10 ? ('0' + d2) : d2
            period = yyyy + "-" + mm + "-" + d2
            break
        //
        case 130:
            break
        //每n周?
        case 131:
            week = getWeek(period) - 8
            week = week < 10 ? ('0' + week) : week
            period = date.getFullYear() + "_" + week;
            break
        //每周
        default:
            week = getWeek(period) - 1
            week = week < 10 ? ('0' + week) : week
            period = date.getFullYear() + "_" + week;
            break
    }
    return period
}

const getWeek = (dt) => {
    let d1 = new Date(dt)
    let d2 = new Date(d1.getFullYear() + "-" + "01-01")
    let millis = d1 - d2
    let days = Math.ceil(millis / (24 * 60 * 60 * 1000))
    let num = Math.ceil(days / 7)
    return num
}

/* 旧版API */
//参考： https://github.com/jsososo/QQMusicApi/
export class QQ {
    static CODE = "qq"
    static TOPLIST_CODE= 99999999
    static RADIO_CODE= 88888888
    static TOPLIST_PREFIX = "TOP_"
    static RADIO_CACHE = { channel: 0, data: [], index: 0 }
    
    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg"
            const reqBody = {
                format: 'json',
                inCharset: 'utf8',
                outCharset: 'utf8'
            }
            getJson(url, reqBody).then(json => {
                const result = []
                //console.log(json)
                const cateNameCached = []
                const list = json.data.categories
                list.forEach(cate => {
                    const cateName = cate.categoryGroupName
                    const category = new Category(cateName)
                    const items = cate.items
                    items.forEach(item => {
                        const name = item.categoryName
                        const id = item.categoryId
                        category.add(name, id)
                    })
                    if(cateNameCached.includes(cateName)) return
                    result.push(category)
                    cateNameCached.push(cateName)
                })
                const firstCate = result[0]
                firstCate.data.splice(1, 0, { key: '排行榜', value: QQ.TOPLIST_CODE })
                firstCate.data.splice(2, 0, { key: '电台', value: QQ.RADIO_CODE })
                resolve({ platform: QQ.CODE, data: result })
            })
        })
    }

    //排行榜列表
    static toplist(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            let result = { offset: 0, limit: 100, page: 1, data: [] }
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = topListReqBody()
            getJson(url, reqBody).then(json => {
                console.log(json)
                
                const groupList = json.req_1.data.group
                groupList.forEach(group => {
                    group.toplist.forEach(item => {
                        const id = QQ.TOPLIST_PREFIX + item.topId
                        const cover = item.frontPicUrl || item.headPicUrl
                        const detail = new Playlist(id, QQ.CODE, cover, item.title) 
                        detail.about = item.intro
                        result.data.push(detail)
                    })
                })
                resolve(result)
            })
        })
    }

    //排行榜详情
    static toplistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = new Playlist()
            const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
            const topid = parseInt(id.replace(QQ.TOPLIST_PREFIX, ''))
            const reqBody = topListDetailReqBody(topid, offset, limit, page)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const playlist = json.req_1.data.data

                result.id = playlist.topId
                result.platform = QQ.CODE
                result.title = playlist.title
                result.cover = playlist.frontPicUrl || playlist.headPicUrl
                result.about = playlist.intro

                const songs = json.req_1.data.songInfoList
                songs.forEach(song => {
                    const artist = song.singer.map(ar => ({id: ar.mid, name: ar.name }))
                    const album = { id: song.album.mid, name: song.album.name }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.album.mid)
                    const track = new Track(song.mid, QQ.CODE, song.name, artist, album, duration, cover)
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //电台列表网页版
    static radioListH5(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, total: 0, data:[] }
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://y.qq.com/n/ryqq/radio"
            getDoc(url).then(doc => {
                const scriptEls = doc.querySelectorAll("script")
                const key = "window.__INITIAL_DATA__"

                let scriptText = null
                for(var scriptEl of scriptEls) {
                    scriptText = scriptEl.textContent
                    if(!scriptText) continue
                    scriptText = scriptText.trim()
                    if(scriptText.includes(key)) break
                }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1].trim().substring(1)
                    scriptText = scriptText.replace(/:undefined,/g, ':"",')
                    const json = JSON.parse(scriptText)
                    
                    json.radio_list.forEach(group => {
                        group.list.forEach(item => {
                            const pid = QQ.RADIO_PREFIX + item.id
                            const title = group.title + '| ' + item.title
                            const playlist = new Playlist(pid, QQ.CODE, item.pic_url, title)
                            playlist.type = Playlist.RADIO
                            result.data.push(playlist)
                        })
                    })
                }
                resolve(result)
            })
        })
    }

    //电台列表
    static radioList(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, total: 0, data:[] }
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = radioListReqBody()
            getJson(url, reqBody).then(json => {
                console.log(json)
                const radioList = json.req_1.data.radio_list
                radioList.forEach(group => {
                    group.list.forEach(item => {
                        const cid = item.id
                        const title = group.title + '| ' + item.title
                        const playlist = new Playlist(cid, QQ.CODE, item.pic_url, title)
                        playlist.isRadioType = true
                        result.data.push(playlist)
                    })
                })
                resolve(result)
            })
        })
    }

    //电台：下一首歌曲
    static nextRadioTrack(channel, track) {
        return new Promise((resolve, reject) => {
            let result = null
            let index = QQ.RADIO_CACHE.index
            const length = QQ.RADIO_CACHE.data.length
            //是否命中缓存
            if(channel == QQ.RADIO_CACHE.channel 
                && index < (length - 1)) {
                result = QQ.RADIO_CACHE.data[++index]
                QQ.RADIO_CACHE.index = index
                resolve(result)
                return 
            }
            //不命中，重置缓存
            QQ.RADIO_CACHE.channel = channel
            QQ.RADIO_CACHE.data.length = 0
            QQ.RADIO_CACHE.index = 0
            //拉取数据
            const firstplay = track ? 0 : 1
            const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = radioSonglistReqBody(channel, firstplay)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const list = json.req_1.data.track_list
                list.forEach(item => {
                    const artist = item.singer.map(ar => ({id: ar.mid, name: ar.name }))
                    const album = { id: item.album.mid, name: item.album.name }
                    const duration = item.interval * 1000
                    const cover = getAlbumCover(item.album.mid)
                    const cache = new Track(item.mid, QQ.CODE, item.title, artist, album, duration, cover)
                    cache.isRadioType = true
                    cache.channel = channel
                    QQ.RADIO_CACHE.data.push(cache)
                })
                result = QQ.RADIO_CACHE.data[0]
                //console.log(QQ.RADIO_CACHE)
                resolve(result)
            })
        })
    }

    //歌单广场(列表)
    static square (cate, offset, limit, page) {
        if(typeof(cate) == 'string') cate = parseInt(cate.trim())
        cate = cate > 0 ? cate : 10000000
        //榜单
        if(cate == QQ.TOPLIST_CODE) return QQ.toplist(cate, offset, limit, page)
        //电台
        if(cate == QQ.RADIO_CODE) return QQ.radioList(cate, offset, limit, page)
        //普通歌单
        return new Promise((resolve, reject) => {
            const url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg"
            const reqBody = {
                format: 'json',
                inCharset: 'utf8',
                outCharset: 'utf8',
                sortId: 5,
                categoryId: cate,
                sin: offset,
                ein: (offset + limit - 1)
            }
            getJson(url, reqBody).then(json => {
                //console.log(json)
                const result = { offset, limit, page, total: 0, data: [] }
                const list = json.data.list
                list.forEach(item => {
                    const cover = item.imgurl

                    const detail = new Playlist(item.dissid, QQ.CODE, cover, item.dissname) 
                    detail.about = item.introduction
                    result.data.push(detail)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        if(id.startsWith(QQ.TOPLIST_PREFIX)) {
            return QQ.toplistDetail(id, offset, limit, page)
        }
        return new Promise((resolve, reject) => {
            const result = new Playlist()
            const url = "http://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg"
            const reqBody = { 
                format: 'json',
                type: 1,
                utf8: 1,
                disstid: id, // 歌单的id
                loginUin: 0,
            }
            getJson(url, reqBody).then(json => {
                console.log(json)
                const playlist = json.cdlist[0]

                result.id = playlist.dissid
                result.platform = QQ.CODE
                result.title = playlist.dissname
                result.cover = playlist.logo
                result.about = playlist.desc

                const songs = playlist.songlist
                songs.forEach(song => {
                    const artist = song.singer.map(e => ({id: e.mid, name: e.name }))
                    const album = { id: song.albummid, name: song.albumname }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.albummid)
                    const track = new Track(song.songmid, QQ.CODE, song.songname, artist, album, duration, cover)
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id) {
        return new Promise((resolve, reject) => {
            let url = "http://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = {
                format: 'json',
                data: JSON.stringify({
                    songinfo: moduleReq('music.pf_song_detail_svr', 'get_song_detail_yqq', 
                    {
                        song_mid: id
                    })
                })
            }
            getJson(url, reqBody).then(json => {
                console.log(json)
                const trackInfo = json.songinfo.data.track_info
                QQ.getVKeyJson(trackInfo).then(json => {
                    //console.log(json)
                    const data = json.req_1.data;
                    const urlInfo = data.midurlinfo[0]
                    const vkey = urlInfo.vkey.trim()
                    const result = new Track(id, QQ.CODE)
                    if(vkey.length > 0) {
                        result.url = data.sip[0] + urlInfo.purl
                    }
                    resolve(result)
                })
            })            
        })
    }

    //获取VKey、purl和sip服务器等信息
    static getVKeyJson(trackInfo) {
        return new Promise((resolve, reject) => {
            let url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = vkeyReqBody(trackInfo)
            getJson(url, reqBody).then(json => {
                console.log(json)
                resolve(json)
            })
        })
    }

    //歌词
    static lyric(id) {
        return new Promise((resolve, reject) => {
            const url = "http://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg"
            const reqBody = lyricReqBody(id) 
            getJson(url, reqBody).then(json => {
                console.log(json)
                let lyric = json.lyric
                //console.log(lyric)
                if(lyric) {
                    lyric = CryptoJS.enc.Base64.parse(lyric).toString(CryptoJS.enc.Utf8)
                    lyric = escapeHtml(lyric)
                    //console.log(lyric)
                    const result = Lyric.parseFromText(lyric)
                    resolve(result)
                } else {
                    resolve(new Lyric())
                }
            })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)、热门歌曲等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://y.qq.com/n/ryqq/singer/" + id
            getDoc(url).then(doc => {
                const scriptEls = doc.querySelectorAll("script")
                const key = "window.__INITIAL_DATA__"

                let scriptText = null
                for(var scriptEl of scriptEls) {
                    scriptText = scriptEl.textContent
                    if(!scriptText) continue
                    scriptText = scriptText.trim()
                    if(scriptText.includes(key)) break
                }
                const result = { id, name: '趁青春', cover: 'default_cover.png', data:[], about: '' }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1].trim().substring(1)
                    scriptText = scriptText.replace(/:undefined,/g, ':"",')
                    const json = JSON.parse(scriptText)
                    
                    const detail = json.singerDetail
                    result.name = detail.basic_info.name
                    result.cover = detail.pic.pic
                    result.about = detail.descstr
                }
                resolve(result)
            })
        })
    }

    //@Deprecated 弃用 
    static artistDetailDesc(id) {
        return new Promise((resolve, reject) => {
            const url = "http://c.y.qq.com/splcloud/fcgi-bin/fcg_get_singer_desc.fcg"
            const reqBody = {
                singermid: id,
                format: 'xml',
                utf8: 1,
                outCharset: 'utf8'
            }
            getRaw(url, reqBody).then(xml => {
                console.log(xml)
                const result = { id, name:'', cover:'', data:[] }
                resolve(result)
            })
        })
    }

    //歌手详情：热门歌曲
    static artistDetailHotSongs(id) {
        return new Promise((resolve, reject) => {
            const url = "http://u.y.qq.com/cgi-bin/musicu.fcg"
            const offset = 0
            const limit = 365
            const page = 1
            const reqBody = artistHotSongReqBody(id, offset, limit)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const result = { id, offset, limit, page, data: [] }
                const songList = json.req_1.data.songlist
                songList.forEach(item => {
                    const artist = item.singer.map(ar => ({ id: ar.mid, name: ar.name }))
                    const album = {  id: item.album.mid,  name: item.album.name }
                    const duration = item.interval * 1000
                    const cover = getAlbumCover(item.album.mid)

                    const track = new Track(item.mid, QQ.CODE, item.title, 
                        artist, album, duration, cover)
                    result.data.push(track)
                })
                resolve(result)
            })
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "http://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = artistAlbumReqBody(id, offset, limit)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const result = { id, offset, limit, page, data: [] }
                const albumList = json.req_1.data.list
                albumList.forEach(item => {
                    const artist = item.singers.map(ar => ({ id: ar.singer_mid, name: ar.singer_name }))
                    const cover = getAlbumCover(item.album_mid)
                    const album = new Album(item.album_mid, QQ.CODE, item.album_name, cover, artist)
                    album.publishTime = item.pub_time
                    result.data.push(album)
                })
                resolve(result)
            })
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://y.qq.com/n/ryqq/albumDetail/" + id
            getDoc(url).then(doc => {
                const scriptEls = doc.querySelectorAll("script")
                const key = "window.__INITIAL_DATA__"

                let scriptText = null
                for(var scriptEl of scriptEls) {
                    scriptText = scriptEl.textContent
                    if(!scriptText) continue
                    scriptText = scriptText.trim()
                    if(scriptText.includes(key)) break
                }
                const result = new Album(id, QQ.CODE, '山川湖海，日月星辰', 'default_cover.png')
                if(scriptText) {
                    scriptText = scriptText.split(key)[1].trim().substring(1)
                    scriptText = scriptText.replace(/:undefined,/g, ':"",')
                    const json = JSON.parse(scriptText)
                    console.log(json)
                    
                    const detail = json.detail
                    result.title = detail.albumName
                    result.cover = detail.picurl.startsWith("//") ? ("https:" + detail.picurl) : detail.picurl
                    result.artist = detail.singer.map(ar => ({ id: ar.mid, name: ar.name }))
                    result.publishTime = detail.ctime
                    result.company = detail.company
                    result.about = detail.desc
                }
                resolve(result)
            })
        })
    }

    //专辑详情: 歌曲
    static albumDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&format=json&inCharset=utf8&outCharset=utf8"
            const reqBody = albumAllSongsReqBody(id, offset, limit)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const result = new Album(id)
                const songList = json.req_1.data.songList
                songList.forEach(item => {
                    const song = item.songInfo
                    const artist = song.singer.map(ar => ({ id: ar.mid, name: ar.name }))
                    const album = { id, name: song.album.name }
                    const cover = getAlbumCover(id)
                    const duration = song.interval * 1000
                    const track = new Track(song.mid, QQ.CODE, song.name, artist, album, duration, cover)
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = "http://c.y.qq.com/soso/fcgi-bin/client_search_cp"
            const reqBody = searchParam(keyword, 0, offset, limit, page)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const list = json.data.song.list
                const data = list.map(item => {
                    const artist = item.singer.map(ar => ({ id: ar.mid, name: ar.name }))
                    const album = { id: item.albummid, name : item.albumname }
                    const duration = item.interval * 1000
                    const cover = getAlbumCover(item.albummid)
                    const track = new Track(item.songmid, QQ.CODE, item.songname, artist, album, duration, cover)
                    return track
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        }) 
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://c.y.qq.com/soso/fcgi-bin/client_music_search_songlist"
            const reqBody = {
                format: 'json',
                // inCharset: 'utf8',
                // outCharset: 'utf8',
                remoteplace: 'txt.yqq.playlist',
                page_no: page,
                num_per_page: limit,
                query: keyword
            }
            getJson(url, reqBody).then(json => {
                console.log(json)
                const list = json.data.list
                const data = list.map(item => {
                    const playlist = new Playlist(item.dissid, QQ.CODE, item.imgurl, escapeHtml(item.dissname))
                    return playlist
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        }) 
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "http://c.y.qq.com/soso/fcgi-bin/client_search_cp"
            const reqBody = searchParam(keyword, 8, offset, limit, page)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const list = json.data.album.list
                const data = list.map(item => {
                    const album = new Album(item.albumMID, QQ.CODE, item.albumName, item.albumPic)
                    album.publishTime = item.publicTime
                    return album
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        }) 
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "http://c.y.qq.com/soso/fcgi-bin/client_search_cp"
            const reqBody = searchParam(keyword, 9, offset, limit, page)
            getJson(url, reqBody).then(json => {
                console.log(json)
                const list = json.data.singer.list
                const result = { offset, limit, page, data: [] }
                if(list) {
                    result.data = list.map(item => ({
                        id: item.singerMID,
                        platform: QQ.CODE,
                        title: item.singerName,
                        cover: item.singerPic
                    }))
                }   
                resolve(result)
            })
        }) 
    }

}