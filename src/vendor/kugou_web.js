import { getDoc, postJson, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";
import CryptoJS from 'crypto-js';

const REQ_ID = 'e2db8a61-afdb-11ec-9d7b-c9324a8678ec'

const COOKIES =  {
    kg_mid: "b1ce9c8ff7a5081551d9fe09a396d9c1",
    kg_dfid: "11TXg30ah9CE2JoRol2OeAmD",
    kg_dfid_collect: "d41d8cd98f00b204e9800998ecf8427"
}

const searchParam = (param) => {
    const md5Key = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
    param = param.split('&').sort().join('')
    return md5Key + param + md5Key
}

const getDataUrl = (hash, albumId) => {
    return "https://wwwapi.kugou.com/yy/index.php?r=play/getdata" 
        + "&hash=" + hash + "&dfid=" + COOKIES.kg_dfid
        + "&appid=1014" + "&mid=" + COOKIES.kg_mid
        + "&platid=4" + "&album_id=" + albumId
        + "&_="
}

const getCustomCover = (origin) => {
    if(!origin) return origin
    //http://c1.kgimg.com/custom/150/20201207/20201207134716994336.jpg
    //https://imge.kugou.com/temppic/20130807/20130807185439172736.png
    //https://imge.kugou.com/stdmusic/20180712/20180712154305100613.jpg
    const keys = ['/custom/150/', '/temppic/', '/{size}', '/stdmusic/' ]
    const size = '480'
    if(origin.includes(keys[0])) {
        return 'https://imgessl.kugou.com/custom/' + size + '/' + origin.split(keys[0])[1]
    } else if(origin.includes(keys[1])) {
        return 'https://imgessl.kugou.com/custom/' + size + '/' + origin.split(keys[1])[1]
    } else if(origin.includes(keys[2])) {
        return origin.replace(keys[2], '/' + size)
    } else if(origin.includes(keys[3])) {
        return 'https://imge.kugou.com/stdmusic/' + size + '/' + origin.split(keys[3])[1]
    } 
    return origin
}

const jsonify = (text) => {
    text = text.replace(/\/\/ \S*/g, '') //注释
        .replace(/\s/g, '') //空白符
        .replace(/'/g, '"')
        .replace('{', '{"')
        .replace('}', '"}')
        .replace(/,/g, '","')
        .replace(/:/g, '":"')
        .replace(/""/g, '"')
        .replace('https":"', 'https:')
    return JSON.parse(text)
}

//Web版API
export class KuGou {
    static CODE = 'kugou'
    static TOPLIST_CODE = "0-0-0"
    static RADIO_CODE = "f-m-0"
    static TOPLIST_PREFIX = "TOP_"
    static RADIO_CACHE = { channel: 0, data: [], index: 0, page: 1 }

    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const defaultCategory = new Category("默认")
            defaultCategory.add("榜单", KuGou.TOPLIST_CODE)
            defaultCategory.add("电台", KuGou.RADIO_CODE)

            const playlistCategory = new Category("歌单")
            playlistCategory.add("推荐", '1-5-0')
            playlistCategory.add("最热", '1-6-0')
            playlistCategory.add("最新", '1-7-0')
            playlistCategory.add("热藏", '1-3-0')
            playlistCategory.add("飙升", '1-8-0')
            playlistCategory.add("其他", '1-0-0')
            //otherCategory.add("未知", '1-9-0')

            const result = [ defaultCategory, playlistCategory ]
            resolve({ platform: KuGou.CODE, data: result })
        })
    }

    //榜单列表
    static toplist(cate, offset, limit, page) {
        const result = { platform: KuGou.CODE, cate, offset, limit, page, total:0, data: [] }
        return new Promise((resolve, reject) => {
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://www.kugou.com/yy/html/rank.html"
            getDoc(url).then(doc => {
                const liEls = doc.querySelectorAll('.pc_temp_side li')
                liEls.forEach(el => {
                    const href = el.querySelector('a').getAttribute('href')
                    const style = el.querySelector('span').getAttribute('style')
                    const title = el.querySelector('a').getAttribute('title')

                    const id = KuGou.TOPLIST_PREFIX + href.split('-')[1].split('.html')[0]
                    let cover = style.split('(')[1].split(')')[0]
                    cover = getCustomCover(cover)
                    
                    const playlist = new Playlist(id, KuGou.CODE, cover, title)
                    playlist.url = href
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //榜单详情
    static toplistDetail(id, offset, limit, page) {
        id = id.replace(KuGou.TOPLIST_PREFIX, '')
        return new Promise((resolve, reject) => {
            const result = new Playlist()
            const url = "https://www.kugou.com/yy/rank/home/" + page + "-" + id + ".html?from=rank"
            getDoc(url).then(doc => {
                const title = doc.querySelector('#pc_temp_title h3').textContent
                const about = doc.querySelector('#pc_temp_title .rank_update').textContent

                result.title = title
                result.about = about
                
                //Tracks
                const scripts = doc.body.getElementsByTagName('script')
                let key = 'var global ='
                let scriptText = null
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = 'global.features ='
                    
                    let paginationText = scriptText.split(key)[0]
                    paginationText = paginationText.split(';')[0].trim()
                    
                    const pagination = jsonify(paginationText)
                    result.total = parseInt(pagination.total)

                    scriptText = scriptText.split(key)[1]
                    key = '(function()'
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText.substring(0, scriptText.length - 1)
                    const json = JSON.parse(scriptText)
                    
                    json.forEach(item => {
                        const artist = [ { id: '', name: item.author_name } ]
                        const album = { id: item.album_id, name: '' }
                        const duration = item.timeLen * 1000
                        const track = new Track(item.audio_id, KuGou.CODE, item.FileName, artist, album, duration)
                        track.hash = item.Hash
                        track.artistNotCompleted = true
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //电台列表（旧版Web API）
    static radioListOld(cate, offset, limit, page) {
        const result = { platform: KuGou.CODE, cate, offset, limit, page, total: 0, data: [] }
        return new Promise((resolve, reject) => {
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://www.kugou.com/fmweb/html/index.html"
            getDoc(url).then(doc => {
                const scripts = doc.body.querySelectorAll('script')
                let scriptText = null
                let key = 'var radioData ='
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = 'var tempArr ='
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText.substring(0, scriptText.length - 1)
                    const json = JSON.parse(scriptText)
                    
                    json.forEach(item => {
                        if(item.songs.length < 1) return 
                        const playlist = new Playlist(item.fmid, KuGou.CODE, getCustomCover(item.imgurl32), item.fmname, null, item.description)
                        playlist.isRadioType = true
                        result.data.push(playlist)
                    })
                }
                resolve(result)
            })
        })
    }

    //电台列表
    static radioList(cate, offset, limit, page) {
        const result = { platform: KuGou.CODE, cate, offset, limit, page, total: 0, data: [] }
        return new Promise((resolve, reject) => {
            if(page > 1) {
                resolve(result)
                return
            }
            const url = "https://www.kugou.com/fmweb/html/index.html"
            getDoc(url).then(doc => {
                const list = doc.body.querySelectorAll('.main .radio')
                list.forEach(item => {
                    const url = item.getAttribute('href')
                    const fmid = url.split('#fm_id=')[1].split('&')[0]
                    const cover = item.querySelector('.cover img').getAttribute('src')
                    const title = item.querySelector('.name').textContent
                    const playlist = new Playlist(fmid, KuGou.CODE, cover, title, url)
                    playlist.isRadioType = true
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //电台：下一首歌曲
    static nextPlaylistRadioTrack(channel, track) {
        return new Promise((resolve, reject) => {
            //TODO
            let result = null
            let index = KuGou.RADIO_CACHE.index
            let page = KuGou.RADIO_CACHE.page
            const length = KuGou.RADIO_CACHE.data.length
            //是否命中缓存
            if(channel == KuGou.RADIO_CACHE.channel) {
                if(index < (length - 1)) {
                    result = KuGou.RADIO_CACHE.data[++index]
                    KuGou.RADIO_CACHE.index = index
                    resolve(result)
                    return
                } else {
                    KuGou.RADIO_CACHE.page = ++page
                }
            } else { //不命中，重置缓存分页参数
                KuGou.RADIO_CACHE.page = 1
            }
            //不命中，重置缓存
            KuGou.RADIO_CACHE.channel = channel
            KuGou.RADIO_CACHE.data.length = 0
            KuGou.RADIO_CACHE.index = 0
            
            page = KuGou.RADIO_CACHE.page
            const limit = 20
            const offset = (page - 1) * limit

            const url = "https://gateway.kugou.com/openapicdn/broadcast/v2/get_songlist"
            const reqBody = {
                radio_id: channel,
                offset,
                pagesize: limit
            }
            getJson(url, reqBody).then(json => {
                const list = json.data.songlist
                list.forEach(item => {
                    if(!item.audio_info) return
                    const artist = [ { id: '', name: item.author_name } ]
                    const album = { id: item.album_info.album_id, name: item.album_info.album_name }
                    const duration = item.audio_info.duration_128
                    const cover = getCustomCover(item.album_info.sizable_cover)
                    const cache = new Track(item.album_audio_id, KuGou.CODE, item.audio_name, artist, album, duration, cover)
                    cache.isRadioType = true
                    cache.channel = channel
                    cache.hash = item.audio_info.hash_128
                    cache.artistNotCompleted = true
                    KuGou.RADIO_CACHE.data.push(cache)
                })
                result = KuGou.RADIO_CACHE.data[0]
                resolve(result)
            })
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page) {
        const originCate = cate
        let resolvedCate = cate.trim()
        resolvedCate = resolvedCate.length > 0 ? resolvedCate : KuGou.TOPLIST_CODE
        //榜单
        if(resolvedCate === KuGou.TOPLIST_CODE) return KuGou.toplist(cate, offset, limit, page)
        //电台
        if(resolvedCate === KuGou.RADIO_CODE) return KuGou.radioList(cate, offset, limit, page)
        //普通歌单
        return new Promise((resolve, reject) => {
            const result = { platform: KuGou.CODE, cate: originCate, offset, limit, page, total: 0, data: [] }
            if(page > 1) { //TODO
                resolve(result)
                return 
            }
            const url = "https://www.kugou.com/yy/special/index/" + resolvedCate + ".html"
            getDoc(url).then(doc => {
                const list = doc.querySelectorAll('.spe #ulAlbums li')
                list.forEach(el => {
                    const id = el.getAttribute('class').split('_')[1]
                    let cover = el.querySelector('.pic img').getAttribute('_src')
                    cover = getCustomCover(cover)
                    const title = el.querySelector('.detail a').textContent
                    const about = el.querySelector('.detail .text').textContent

                    const playlist = new Playlist(id, KuGou.CODE, cover, title)
                    playlist.about = about
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        id = (id + '').trim()
        if(id.startsWith(KuGou.TOPLIST_PREFIX)) return KuGou.toplistDetail(id, offset, limit, page)
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/special/single/" + id + ".html"
            getDoc(url).then(doc => {
                let cover = doc.querySelector('.specialPage .pic img').getAttribute('_src')
                cover = getCustomCover(cover)
                const title = doc.querySelector('.specialPage .pic img').getAttribute('alt')
                const about = doc.querySelector('.specialPage .more_intro').textContent

                const result = new Playlist(id, KuGou.CODE, cover, title, null, about)
                //Tracks
                let key = 'var data='
                const scripts = doc.head.getElementsByTagName('script')
                let scriptText = null
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = 'specialData ='
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText.substring(0, scriptText.length - 1)
                    const json = JSON.parse(scriptText)
                    
                    json.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if(authors && authors.length > 0) {
                            trackCover = getCustomCover(authors[0].sizable_avatar)
                            const arData = authors.map(ar => ({
                                id: ar.author_id, name: ar.author_name
                            }))
                            artist.push(...arData)
                        }
                        const track = new Track(item.audio_id, KuGou.CODE, item.songname, artist, album, duration, trackCover)
                        track.hash = item.hash
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const url = getDataUrl(track.hash, track.album.id)
            getJson(url).then(json => {
                const result = new Track(id, KuGou.CODE)
                result.url = json.data.play_url
                result.cover = json.data.img
                const lyricText = json.data.lyrics
                result.lyric = Lyric.parseFromText(lyricText)
                result.artist = json.data.authors.map(ar => ({ id: ar.author_id, name: ar.author_name}))
                resolve(result)
            })
        })
    }

    //歌词
    static lyric(id) {
        return new Promise((resolve, reject) => {
            const result = new Lyric()
            resolve(result)
        })
    }

    //歌手详情：Name、Cover、简介(如果有)等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/singer/" + id + ".html"
            getDoc(url).then(doc => {
                const cover = doc.querySelector('.sng_ins_1 .top img').getAttribute('_src')
                const title = doc.querySelector('.sng_ins_1 .top .intro strong').textContent
                const about = doc.querySelector('.sng_ins_1 #singer_content').textContent

                const result = { id, title, cover, about }
                resolve(result)
            })
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            if(page > 1) {
                resolve({ offset, limit, page, total: 0, data: [] })
                return
            }
            const url = "https://www.kugou.com/yy/"
                + "?r=singer/song&sid=" + id 
                + "&p=" + page + "&t=" + Date.now()
            postJson(url).then(json => {
                
                const total = json.total
                const data = []
                const list = json.data
                list.forEach(item => {
                    const artist = [ { id, name: item.author_name } ]
                    const album = { id: item.album_id, name: item.album_name }
                    const duration = item.duration
                    const track = new Track(item.songid, KuGou.CODE, item.songname, artist, album, duration)
                    track.hash = item.hash
                    data.push(track)
                })
                const result = { offset, limit, page, total, data }
                resolve(result)
            })
        })
    }
    
    //歌手详情: 专辑
    static artistDetailAlbums(id, offet, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/"
                + "?r=singer/album&sid=" + id 
                + "&p=" + page + "&t=" + Date.now()
            postJson(url).then(json => {
                
                const total = json.total
                const data = []
                const list = json.data
                list.forEach(item => {
                    const artist = [ { id, name: item.singername } ]
                    const track = new Album(item.albumid, KuGou.CODE, item.albumname, item.img, artist)
                    data.push(track)
                })
                const result = { offet, limit, page, total, data }
                resolve(result)
            })
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/album/" + id + ".html"
            getDoc(url).then(doc => {
                const cover = doc.querySelector('.pic img').getAttribute('_src')
                const detailItems = doc.querySelector('.detail').childNodes
                const title = detailItems.item(2).textContent
                const artistName = detailItems.item(6).textContent
                const publishTime = detailItems.item(12).textContent
                const about = doc.querySelector('.intro').textContent
                const artist = [ {id: 0, name: artistName } ]

                //Tracks
                let key = 'var data='
                const scripts = doc.body.getElementsByTagName('script')
                let scriptText = null
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }

                const data = []
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = '];'
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText + "]"
                    const json = JSON.parse(scriptText)
                        
                    json.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if(authors && authors.length > 0) {
                            trackCover = authors[0].sizable_avatar.replace('{size}', '400')
                            const arData = authors.map(ar => ({
                                id: ar.author_id, name: ar.author_name
                            }))
                            artist.push(...arData)
                        }
                        const track = new Track(item.audio_id, KuGou.CODE, item.songname, artist, album, duration, trackCover)
                        track.hash = item.hash
                        data.push(track)
                    })
                }

                const result = new Album(id, KuGou.CODE, title, cover, artist, null, publishTime, about, data)
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const now = Date.now()
            const callbackFn = 'callback123'
            let param = "callback=" + callbackFn + "&keyword=" + keyword + "&page=" + page + "&pagesize=" + limit 
                        + "&bitrate=0&isfuzzy=0&inputtype=0&platform=WebFilter&userid=0&clientver=2000"
                        + "&iscorrection=1&privilege_filter=0&token=&srcappid=2919" 
                        + "&clienttime=" + now + "&mid=" + now + "&uuid=" + now + "&dfid=-"
            const md5Param = searchParam(param)
            const signature = CryptoJS.MD5(md5Param).toString().toUpperCase()
            const url = "https://complexsearch.kugou.com/v2/search/song" + "?" + param + "&signature=" + signature
            
            getJson(url).then(jsonp => {
                let jsonText = jsonp.split(callbackFn + "(")[1].trim()
                jsonText = jsonText.substring(0, jsonText.length - 1)
                const json = JSON.parse(jsonText)
                

                const data = json.data.lists.map(item => {
                    const artist = item.Singers
                    const album = { id: item.AlbumID, name: item.AlbumName }
                    const duration = item.Duration * 1000
                    const track = new Track(item.ID, KuGou.CODE, item.SongName, artist, album, duration, item.pic)
                    track.hash = item.FileHash
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
            const now = Date.now()
            const callbackFn = 'callback123'
            let param = "callback=" + callbackFn + "&keyword=" + keyword + "&page=" + page + "&pagesize=" + limit 
                        + "&platform=WebFilter&userid=0&clientver=2000"
                        + "&iscorrection=1&privilege_filter=0&token=&srcappid=2919" 
                        + "&clienttime=" + now + "&mid=" + now + "&uuid=" + now + "&dfid=-"
            const md5Param = searchParam(param)
            const signature = CryptoJS.MD5(md5Param).toString().toUpperCase()
            const url = "https://complexsearch.kugou.com/v1/search/special" + "?" + param + "&signature=" + signature
            
            getJson(url).then(jsonp => {
                let jsonText = jsonp.split(callbackFn + "(")[1].trim()
                jsonText = jsonText.substring(0, jsonText.length - 1)
                const json = JSON.parse(jsonText)
                

                const data = json.data.lists.map(item => {
                    const track = new Playlist(item.specialid, KuGou.CODE, getCustomCover(item.img), item.specialname, item.intro)
                    return track
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        })
    }
    
    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, data: [] }
            resolve(result)
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, data: [] }
            resolve(result)
        })
    }

}