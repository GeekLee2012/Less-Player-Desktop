import { getDoc, postJson, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";
import { base64Decode, md5, toUtf8 } from "../common/Utils";


const REQ_ID = 'e2db8a61-afdb-11ec-9d7b-c9324a8678ec'

const COOKIES = {
    kg_mid: "b1ce9c8ff7a5081551d9fe09a396d9c1",
    kg_dfid: "11TXg30ah9CE2JoRol2OeAmD",
    kg_dfid_collect: "d41d8cd98f00b204e9800998ecf8427"
}

const signParam = (param) => {
    const md5Key = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
    param = param.split('&').sort().join('')
    return md5Key + param + md5Key
}

const getSignature = (param) => {
    const sign = md5(signParam(param)) || ''
    return sign.toUpperCase()
}

const getDataUrl = (hash, albumId) => {
    return "https://wwwapi.kugou.com/yy/index.php?r=play/getdata"
        + "&hash=" + hash + "&dfid=" + COOKIES.kg_dfid
        + "&appid=1014" + "&mid=" + COOKIES.kg_mid
        + "&platid=4" + "&album_id=" + albumId
        + "&_="
}

const getCustomCover = (origin) => {
    if (!origin) return origin
    //http://c1.kgimg.com/custom/150/20201207/20201207134716994336.jpg
    //https://imge.kugou.com/temppic/20130807/20130807185439172736.png
    //https://imge.kugou.com/stdmusic/20180712/20180712154305100613.jpg
    const keys = ['/custom/150/', '/temppic/', '/{size}', '/stdmusic/']
    const size = '480'
    if (origin.includes(keys[0])) {
        return 'https://imgessl.kugou.com/custom/' + size + '/' + origin.split(keys[0])[1]
    } else if (origin.includes(keys[1])) {
        return 'https://imgessl.kugou.com/custom/' + size + '/' + origin.split(keys[1])[1]
    } else if (origin.includes(keys[2])) {
        return origin.replace(keys[2], '/' + size)
    } else if (origin.includes(keys[3])) {
        return 'https://imge.kugou.com/stdmusic/' + size + '/' + origin.split(keys[3])[1]
    }
    return origin
}

const jsonify = (text) => {
    //text = text ? text.trim() : ''
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

//客户端API
export class KuGou {
    static CODE = 'kugou'
    static TOPLIST_CODE = "0-0-0"
    static RADIO_CODE = "f-m-0"
    static TOPLIST_PREFIX = "TOP_"
    static RADIO_CACHE = { channel: 0, data: [], page: 1 }

    //全部歌单分类
    static categories() {
        return new Promise((resolve, reject) => {
            const result = { platform: KuGou.CODE, data: [], orders: [] }
            const url = 'http://mac.kugou.com/v2/musicol/yueku/v1/special/index/getData/getData.html&cdn=cdn&t=5&c='
            getDoc(url).then(doc => {
                //specail? 拼写错误！正确：special
                const menulist = doc.querySelectorAll('.pc_specail_menu')
                    || doc.querySelectorAll('.pc_special_menu')
                menulist.forEach(menu => {
                    const cateName = menu.querySelector('h3').textContent
                    const category = new Category(cateName)
                    const list = menu.querySelectorAll('.pc_specail_menu_content a')
                        || menu.querySelectorAll('.pc_special_menu_content a')
                    list.forEach(item => {
                        const name = item.textContent
                        const value = item.getAttribute('href').split('&c=')[1].split("'")[0]
                        category.add(name, value)
                    })
                    result.data.push(category)
                })
                result.data[0].add("榜单", KuGou.TOPLIST_CODE)
                    .add("电台", KuGou.RADIO_CODE)

                result.orders.push(...[
                    { key: "推荐", value: "5" },
                    { key: "最热", value: "6" },
                    { key: "最新", value: "7" },
                    { key: "热藏", value: "3" },
                    { key: "飙升", value: "8" },
                ])
                resolve(result)
            })
        })
    }

    //榜单列表
    static toplist(cate, offset, limit, page, order) {
        const result = { platform: KuGou.CODE, cate, offset, limit, page, total: 0, data: [] }
        return new Promise((resolve, reject) => {
            if (page > 1) {
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
                for (var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if (scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if (scriptText) {
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
                        const artist = [{ id: '', name: item.author_name }]
                        const album = { id: item.album_id, name: '' }
                        const duration = item.timeLen * 1000
                        const track = new Track(item.audio_id, KuGou.CODE, item.FileName, artist, album, duration)
                        track.hash = item.Hash
                        track.artistNotCompleted = true
                        track.pid = id
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //电台列表
    static playlistRadios(cate, offset, limit, page, order) {
        const result = { platform: KuGou.CODE, cate, offset, limit, page, total: 0, data: [] }
        return new Promise((resolve, reject) => {
            if (page > 1) {
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
                    //playlist.isRadioType = true
                    playlist.type = Playlist.NORMAL_RADIO_TYPE
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //电台：下一首歌曲
    static nextPlaylistRadioTrack(channel, track) {
        return new Promise((resolve, reject) => {
            let result = null
            const index = !track ? 0 :
                KuGou.RADIO_CACHE.data.findIndex(item => item.id == track.id)
            const length = KuGou.RADIO_CACHE.data.length
            //是否命中缓存
            if (channel == KuGou.RADIO_CACHE.channel) {
                if (length > 0 && index > -1 && index < (length - 1)) {
                    result = KuGou.RADIO_CACHE.data[index + 1]
                    resolve(result)
                    return
                }
                KuGou.RADIO_CACHE.page += 1
            } else { //不命中，重置缓存分页参数
                KuGou.RADIO_CACHE.page = 1
            }
            //不命中，重置缓存
            KuGou.RADIO_CACHE.channel = channel
            KuGou.RADIO_CACHE.data.length = 0

            const page = KuGou.RADIO_CACHE.page
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
                    if (!item.audio_info) return
                    const artist = [{ id: '', name: item.author_name }]
                    const album = { id: item.album_info.album_id, name: item.album_info.album_name }
                    const duration = item.audio_info.duration_128
                    const cover = getCustomCover(item.album_info.sizable_cover)
                    const cache = new Track(item.album_audio_id, KuGou.CODE, item.audio_name, artist, album, duration, cover)
                    //cache.isRadioType = true
                    cache.type = Playlist.NORMAL_RADIO_TYPE
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
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || "").toString().trim()
        order = order || 5
        //榜单
        if (resolvedCate === KuGou.TOPLIST_CODE) return KuGou.toplist(cate, offset, limit, page, order)
        //电台
        if (resolvedCate === KuGou.RADIO_CODE) return KuGou.playlistRadios(cate, offset, limit, page, order)
        //普通歌单
        return new Promise((resolve, reject) => {
            const result = { platform: KuGou.CODE, cate: originCate, order, offset, limit, page, total: 0, data: [] }
            const url = 'http://mac.kugou.com/v2/musicol/yueku/v1/special/index/getData/getData.html&cdn=cdn&p='
                + page + '&pagesize=20&t=' + order + '&c=' + resolvedCate
            getDoc(url).then(doc => {
                let key = 'global.special ='
                const scripts = doc.getElementsByTagName('script')
                let scriptText = null
                for (var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if (scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if (scriptText) {
                    const globalData = Function(scriptText + ' return global')()
                    result.total = Math.ceil(parseInt(globalData.total) / limit)

                    const list = globalData.special
                    list.forEach(item => {
                        const id = item.specialid
                        const cover = getCustomCover(item.img)
                        const title = item.specialname
                        const about = item.intro
                        const playlist = new Playlist(id, KuGou.CODE, cover, title, null, about)
                        result.data.push(playlist)
                    })
                }
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        id = (id + '').trim()
        if (id.startsWith(KuGou.TOPLIST_PREFIX)) return KuGou.toplistDetail(id, offset, limit, page)
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/special/single/" + id + ".html"
            //const url = "http://mac.kugou.com/v2/musicol/yueku/v1/special/single/" + id + "-5-9999.html"
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
                for (var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if (scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if (scriptText) {
                    const json = Function(scriptText + ' return data')()

                    json.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if (authors && authors.length > 0) {
                            trackCover = getCustomCover(authors[0].sizable_avatar)
                            const arData = authors.map(ar => ({
                                id: ar.author_id, name: ar.author_name
                            }))
                            artist.push(...arData)
                        }
                        const track = new Track(item.audio_id, KuGou.CODE, item.songname, artist, album, duration, trackCover)
                        track.hash = item.hash
                        track.pid = id
                        track.payPlay = (item.vip != 0)
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetailMac(id, offset, limit, page) {
        id = (id + '').trim()
        if (id.startsWith(KuGou.TOPLIST_PREFIX)) return KuGou.toplistDetail(id, offset, limit, page)
        return new Promise((resolve, reject) => {
            //TODO
            const url = "http://mac.kugou.com/v2/musicol/yueku/v1/special/single/" + id + "-5-9999.html"

            getDoc(url).then(doc => {
                const result = new Playlist(id, KuGou.CODE)
                //Tracks
                let key = 'var global'
                const scripts = doc.body.getElementsByTagName('script')
                let scriptText = null
                for (var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if (scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if (scriptText) {
                    const json = Function(scriptText + ' return global')()

                    result.cover = json.cover.replace("/240/", '/480/')
                    result.title = json.name

                    json.data.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if (authors && authors.length > 0) {
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
                if (json.data.authors) {
                    result.artist = json.data.authors.map(ar => ({ id: ar.author_id, name: ar.author_name }))
                }
                resolve(result)
            })
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            resolve({ id, platform: KuGou.CODE, lyric: null, trans: null })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            //const url = "https://www.kugou.com/singer/" + id + ".html"
            const url = "https://www.kugou.com/singer/info/" + id + "/"
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
            if (page > 1) {
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
                    const artist = [{ id, name: item.author_name }]
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
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/"
                + "?r=singer/album&sid=" + id
                + "&p=" + page + "&t=" + Date.now()
            postJson(url).then(json => {
                const total = json.total
                const data = []
                const list = json.data
                list.forEach(item => {
                    const artist = [{ id, name: item.singername }]
                    const album = new Album(item.albumid, KuGou.CODE, item.albumname, item.img, artist)
                    data.push(album)
                })
                const result = { offset, limit, page, total, data }
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
                const artist = [{ id: 0, name: artistName }]

                //Tracks
                let key = 'var data='
                const scripts = doc.body.getElementsByTagName('script')
                let scriptText = null
                for (var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if (scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }

                const data = []
                if (scriptText) {
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
                        if (authors && authors.length > 0) {
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
            const signature = getSignature(param)
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
                    track.mv = item.MvHash
                    return track
                })
                const result = { platform: KuGou.CODE, offset, limit, page, data }
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
            const signature = getSignature(param)
            const url = "https://complexsearch.kugou.com/v1/search/special" + "?" + param + "&signature=" + signature

            getJson(url).then(jsonp => {
                let jsonText = jsonp.split(callbackFn + "(")[1].trim()
                jsonText = jsonText.substring(0, jsonText.length - 1)
                const json = JSON.parse(jsonText)

                const data = json.data.lists.map(item => {
                    const track = new Playlist(item.specialid, KuGou.CODE, getCustomCover(item.img), item.specialname, item.intro)
                    return track
                })
                const result = { platform: KuGou.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const now = Date.now()
            let param = `appid=1155&clienttime=${now}&clientver=304&dfid=-&keyword=${keyword}`
                + `&mid=e463b0b4d6b10509c05f270142d87a7d&page=${page}&pagesize=20`
                + `&platform=WebFilter&requestid=5&srcappid=2919&tag=em&token=&userid=0&uuid=e35cb5213b6619ec5c61e5cecb61bcf4`
            const signature = getSignature(param)
            const url = "https://complexsearch.kugou.com/v1/search/album" + "?" + param + "&signature=" + signature
            getJson(url).then(json => {
                const data = json.data.lists.map(item => {
                    const album = new Album(item.albumid, KuGou.CODE, item.albumname, item.img)
                    album.publishTime = item.publish_time
                    album.about = item.intro
                    return album
                })
                const result = { platform: KuGou.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: KuGou.CODE, offset, limit, page, data: [] }
            resolve(result)
        })
    }

    //歌手分类
    static artistCategories() {
        return new Promise((resolve, reject) => {
            const alphabet = KuGou.getAlphabetCategory()
            const result = { platform: KuGou.CODE, data: [], alphabet }
            const url = 'https://www.kugou.com/yy/html/singer.html'
            getDoc(url).then(doc => {
                const list = doc.querySelectorAll('.sng .l li')
                const category = new Category("默认")
                result.data.push(category)
                const key = '/index/'
                list.forEach(item => {
                    const aEl = item.querySelector('a')
                    const name = aEl.textContent
                    const href = aEl.getAttribute('href')
                    let value = '1-all-1'
                    if (href.includes(key)) {
                        value = href.split(key)[1].split(".html")[0]
                    }
                    category.add(name, value)
                })
                resolve(result)
            })
        })
    }

    //字母表分类
    static getAlphabetCategory() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const category = new Category("字母")
        category.add('全部', 'all')
        category.add('其他', 'null')
        const array = alphabet.split('')
        for (var i = 0; i < array.length; i++) {
            category.add(array[i], array[i].toLowerCase())
        }
        return category
    }

    //TODO 格式：page-filter-id
    static parseArtistCate(cate, offset, limit, page) {
        try {
            const source = cate['默认'].item.value.split('-')
            source[0] = page
            source[1] = cate['字母'].item.value
            return source.join('-')
        } catch (error) {
            //console.log(error)
        }
        return '1-all-1'
    }

    //歌手(列表)广场
    static artistSquare(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: KuGou.CODE, cate, offset, limit, page, total: 0, data: [] }
            if (page > 5) { //TODO
                result.page = 5
                resolve(result)
                return
            }
            //const url = 'https://www.kugou.com/yy/html/singer.html'
            const resolvedCate = KuGou.parseArtistCate(cate, offset, limit, page)
            const url = 'https://www.kugou.com/yy/singer/index/' + resolvedCate + '.html'
            getDoc(url).then(doc => {
                let els = doc.querySelectorAll('.sng .r #list_head li')
                els.forEach(el => {
                    const aEl = el.querySelector('.pic')
                    //const id = aEl.getAttribute('href').split('/singer/home/')[1].split('.html')[0]
                    const id = aEl.getAttribute('href').split('/singer/info/')[1].split('/')[0]
                    const title = aEl.getAttribute('title')
                    let cover = aEl.querySelector('img').getAttribute('_src')
                    cover = cover.replace('/100/', '/240/')
                    const artist = { id, platform: KuGou.CODE, title, cover }
                    result.data.push(artist)
                })
                els = doc.querySelectorAll('.sng .r .list1 li')
                els.forEach(el => {
                    const aEl = el.querySelector('.text')
                    const id = aEl.getAttribute('href').split('/singer/info/')[1].split('/')[0]
                    const title = aEl.getAttribute('title')
                    //TODO
                    const cover = null
                    const artist = { id, platform: KuGou.CODE, title, cover }
                    result.data.push(artist)
                })
                resolve(result)
            })
        })
    }

    static videoDetail(id, quality) {
        return new Promise((resolve, reject) => {
            const now = Date.now()
            let param = `srcappid=2919&clientver=20000&clienttime=${now}&mid=${now}&uuid=${now}&dfid=-&cmd=123&ext=mp4&hash=${id}&ismp3=0&key=kugoumvcloud&pid=6&ssl=1&appid=1014`
            const signature = getSignature(param)
            const url = `https://gateway.kugou.com/v2/interface/index?${param}&signature=${signature}`
            getJson(url).then(json => {
                const result = { id, platform: KuGou.CODE, quality, url: '' }
                result.url = json.data[id.toLowerCase()].downurl
                resolve(result)
            })
        })
    }
}