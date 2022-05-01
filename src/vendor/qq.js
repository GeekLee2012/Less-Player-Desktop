import { getDoc, getJson, getRaw, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";
import CryptoJS from 'crypto-js';

const escapeHtml = (text) => {
    return text.replace(/[&]#\d+;/g, '')
            .replace(/&apos;/g, "'")
}

const CONFIG = {
    withCredentials: true
}

const moduleReq = (module, method, param) => {
    return { module,  method, param }
}

const getAlbumCover = (albummid) => {
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

/* 旧版API */
//参考： https://github.com/jsososo/QQMusicApi/
export class QQ {
    static CODE = "qq"
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
                        const name = escapeHtml(item.categoryName)
                        const id = item.categoryId
                        category.add(name, id);
                    })
                    if(cateNameCached.includes(cateName)) return
                    result.push(category)
                    cateNameCached.push(cateName)
                })
                resolve(result)
            })
        })
    }

    //歌单广场(列表)
    static square (cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            if(typeof(cate) == 'string') {
                cate = parseInt(cate.trim())
            }
            cate = cate > 0 ? cate : 10000000
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
                let result = { offset, limit, page, data: [] }
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
                    console.log(json)
                    const data = json.req_1.data;
                    const urlInfo = data.midurlinfo[0]
                    const vkey = urlInfo.vkey.trim()
                    const result = new Track()
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
                    result.cover = detail.picurl
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
                    const album = new Album(item.albumMid, QQ.CODE, item.albumName, item.albumPic)
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