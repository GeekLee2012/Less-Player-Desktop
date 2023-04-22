import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { toMillis, toYmd } from "../common/Times";
import { Lyric } from "../common/Lyric";
import forge from 'node-forge';
import { Album } from "../common/Album";
import { isBlank, randomText, toUtf8 } from "../common/Utils";
import CryptoJS from 'crypto-js';



//常量
const MODULUS = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b72"
    + "5152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbd"
    + "a92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe48"
    + "75d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7"
const NONCE = "0CoJUm6Qyw8W8jud"
const PUBLIC_KEY = "010001"
const IV = "0102030405060708"
const CHOICE = "012345679abcdef"

//URL
const BASE_URL = "https://music.163.com"

const rsaEncrypt = (src, publicKey, modulus) => {
    src = src.split('').reverse().join('')

    const m = new forge.jsbn.BigInteger(modulus, 16)
    const k = new forge.jsbn.BigInteger(publicKey, 16)
    const s = new forge.jsbn.BigInteger(forge.util.bytesToHex(src), 16)

    return s.modPow(k, m).toString(16).padStart(256, '0')
}

const aesEncrypt = (src, secKey, iv) => {
    secKey = toUtf8(secKey)
    iv = toUtf8(iv)
    src = toUtf8(src)
    const buffer = CryptoJS.AES.encrypt(src, secKey,
        { iv, mode: CryptoJS.mode.CBC })
    return buffer.toString()
}

const weapi = (text) => {
    if (typeof (text) === 'object') text = JSON.stringify(text)
    let secretkey = randomText(CHOICE, 16)
    let base64Text = aesEncrypt(text, NONCE, IV)
    const params = aesEncrypt(base64Text, secretkey, IV)
    const encSecKey = rsaEncrypt(secretkey, PUBLIC_KEY, MODULUS)
    return { params, encSecKey }
}

const playlistParam = (id) => {
    return {
        id,
        offset: 0,
        total: true,
        limit: 1000,
        n: 1000,
        csrf_token: ""
    }
}

const trackIdsParam = (ids) => {
    const c = []
    ids.forEach(id => {
        c.push({ id })
    })
    return { c: JSON.stringify(c), ids: JSON.stringify(ids) }
}

const playParam = (id) => {
    return {
        ids: [id],
        level: "standard",
        encodeType: "aac",
        csrf_token: ""
    }
}

const lyricParam = (id) => {
    return {
        id,
        lv: -1,
        tv: -1,
        csrf_token: ''
    }
}

const searchParam = (keyword, type) => {
    return {
        hlpretag: '<span class="s-fc7">',
        hlposttag: '</span>',
        s: keyword,
        type,
        offset: 0,
        total: 0,
        limit: 30,
        csrf_token: ''
    }
}

const DEFAULT_CATE = new Category("默认")
DEFAULT_CATE.add("全部", '')

export class NetEase {
    static CODE = 'netease'
    static TOPLIST_CODE = '排行榜'
    static RADIO_PREFIX = 'DJR_'

    //全部分类
    static categories() {
        return new Promise((resolve) => {
            const url = "https://music.163.com/discover/playlist"
            getDoc(url).then(doc => {
                const result = { platform: NetEase.CODE, data: [], orders: [] }
                result.data.push(DEFAULT_CATE)

                const listEl = doc.querySelectorAll("#cateListBox .f-cb")
                listEl.forEach(el => {
                    const cate = el.querySelector("dt").textContent
                    const category = new Category(cate)
                    const fcEls = el.querySelectorAll(".s-fc1")
                    fcEls.forEach(item => {
                        const text = item.textContent
                        category.add(text, text)
                    })
                    result.data.push(category)
                })
                const firstCate = result.data[0]
                firstCate.data.splice(1, 0, { key: '排行榜', value: NetEase.TOPLIST_CODE })
                resolve(result)
            })
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page, order) {
        if (cate == NetEase.TOPLIST_CODE) return NetEase.toplist(cate, offset, limit, page)
        return new Promise((resolve) => {
            const url = "https://music.163.com/discover/playlist"
                + "?cat=" + encodeURIComponent(cate) + "&order=hot"
                + "&limit=" + limit + "&offset=" + offset
            getDoc(url).then(doc => {
                const result = { platform: NetEase.CODE, cate, offset, limit, page, total: 0, data: [] }
                const listEl = doc.querySelectorAll("#m-pl-container li")
                listEl.forEach(el => {
                    let id = null, cover = null, title = null, itemUrl = null, listenNum = 0
                    const coverEl = el.querySelector(".u-cover img")
                    const titleEl = el.querySelector(".dec a")
                    const listenNumEl = el.querySelector(".bottom .nb")

                    if (coverEl) {
                        cover = coverEl.getAttribute("src").replace("140y140", "500y500")
                    }

                    if (titleEl) {
                        title = titleEl.textContent
                        itemUrl = BASE_URL + titleEl.getAttribute('href')
                        id = itemUrl.split('=')[1]
                    }

                    if (listenNumEl) {
                        listenNum = parseInt(listenNumEl.textContent || 0)
                    }

                    if (id && itemUrl) {
                        const playlist = new Playlist(id, NetEase.CODE, cover, title, itemUrl)
                        playlist.listenNum = listenNum
                        result.data.push(playlist)
                    }
                })
                const pgEls = doc.querySelectorAll("#m-pl-pager .u-page .zpgi")
                if (pgEls && pgEls.length > 0) {
                    const totalEl = pgEls[pgEls.length - 1]
                    if (totalEl) result.total = parseInt(totalEl.textContent)
                }
                resolve(result)
            })
        })
    }

    //排行榜列表
    static toplist(cate, offset, limit, page) {
        return new Promise((resolve) => {
            const result = { platform: NetEase.CODE, cate, offset: 0, limit: 100, page: 1, total: 0, data: [] }
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "https://music.163.com/discover/toplist"
            getDoc(url).then(doc => {
                const listEl = doc.querySelectorAll("#toplist li")
                listEl.forEach(el => {
                    let id = null, cover = null, title = null, itemUrl = null

                    const coverEl = el.querySelector(".mine .left img")
                    const titleEl = el.querySelector(".mine .name a")

                    if (coverEl) {
                        cover = coverEl.getAttribute("src").replace("40y40", "500y500")
                    }

                    if (titleEl) {
                        title = titleEl.textContent
                        itemUrl = BASE_URL + titleEl.getAttribute('href')
                        id = itemUrl.split('=')[1]
                    }

                    if (id && itemUrl) {
                        const detail = new Playlist(id, NetEase.CODE, cover, title, itemUrl)
                        result.data.push(detail)
                    }
                });
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        if (id.toString().startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) return NetEase.anchorRadioDetail(id, offset, limit, page)
        return new Promise((resolve, reject) => {
            const result = new Playlist()
            let url = "https://music.163.com/weapi/v3/playlist/detail"
            let param = playlistParam(id)
            let reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const playlist = json.playlist

                result.id = playlist.id
                result.platform = NetEase.CODE
                result.title = playlist.name
                result.cover = playlist.coverImgUrl
                result.about = playlist.description

                const ids = []
                playlist.trackIds.forEach(track => {
                    ids.push(track.id)
                })

                result.total = ids.length
                const end = Math.min((offset + limit), result.total)

                url = "https://music.163.com/weapi/v3/song/detail"
                param = trackIdsParam(ids.slice(offset, end))
                reqBody = weapi(param)
                postJson(url, reqBody).then(json => {
                    const songs = json.songs
                    songs.forEach(song => {
                        const artist = []
                        song.ar.forEach(e => artist.push({ id: e.id, name: e.name }))
                        const album = { id: song.al.id, name: song.al.name }
                        const track = new Track(song.id, NetEase.CODE, song.name, artist, album, song.dt, song.al.picUrl)
                        track.mv = song.mv
                        track.pid = id
                        result.addTrack(track)
                    })
                    resolve(result)
                })
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            NetEase.resolveAnchorRadio(id, track).then(resolvedId => {
                const url = "https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token="
                const param = playParam(resolvedId)
                const reqBody = weapi(param)
                postJson(url, reqBody).then(json => {
                    const result = new Track(id)
                    const song = json.data[0]
                    result.url = song.url
                    resolve(result)
                })
            })
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/song/lyric?csrf_token="
            const param = lyricParam(id);
            const reqBody = weapi(param)
            const result = { id, platform: NetEase.CODE, lyric: null, trans: null }
            postJson(url, reqBody).then(json => {
                Object.assign(result, { lyric: Lyric.parseFromText(json.lrc.lyric) })
                const tlyric = json.tlyric
                if (tlyric) {
                    if (!isBlank(tlyric.lyric)) Object.assign(result, { trans: Lyric.parseFromText(tlyric.lyric) })
                }
                resolve(result)
            })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)、热门歌曲等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/artist" + "?id=" + id
            getDoc(url).then(doc => {
                const title = doc.querySelector("#artist-name").textContent
                let cover = doc.querySelector(".n-artist img").getAttribute('src')
                cover = cover.replace('640y300', '500y500')

                const data = []
                const jsonText = doc.querySelector('#song-list-pre-data').textContent
                const songlist = JSON.parse(jsonText)
                songlist.forEach(item => {
                    const artist = []
                    const itemArtist = item.artists
                    itemArtist.forEach(ar => {
                        artist.push({ id: ar.id, name: ar.name })
                    })

                    const itemAlbum = item.album
                    const album = { id: itemAlbum.id, name: itemAlbum.name }
                    const albumCover = itemAlbum.picUrl

                    const track = new Track(item.id, NetEase.CODE, item.name,
                        artist, album, item.duration, albumCover)
                    track.mv = item.mvid
                    data.push(track)
                })

                const result = { id, platform: NetEase.CODE, title, cover, hotSongs: data }
                resolve(result)
            })
        })
    }

    //歌手详情：热门歌曲
    static artistDetailHotSongs(id) {
        return new Promise(async (resolve, reject) => {
            const result = await NetEase.artistDetail(id)
            const data = result.hotSongs
            result.data = data
            Reflect.deleteProperty(result, 'hotSongs')
            resolve(result)
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/artist/album"
                + "?id=" + id + "&limit=" + limit + "&offset=" + offset
            getDoc(url).then(doc => {
                const data = []

                const list = doc.querySelectorAll('#m-song-module li')
                list.forEach(el => {
                    const coverEl = el.querySelector('.u-cover')
                    const title = coverEl.getAttribute('title')
                    let cover = coverEl.querySelector('img').getAttribute('src')
                    cover = cover.replace('120y120', '500y500')

                    const id = coverEl.querySelector('.msk').getAttribute('href').split('=')[1]
                    const publishTime = el.querySelector(".s-fc3").textContent

                    const album = new Album(id, NetEase.CODE, title, cover)
                    album.publishTime = publishTime
                    data.push(album)
                })
                const result = { id, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //歌手详情: 简介
    static artistDetailAbout(id) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/artist/desc" + "?id=" + id
            getDoc(url).then(doc => {
                const desc = doc.querySelector(".n-artdesc")
                const result = desc ? desc.innerHTML : null
                resolve(result)
            })
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/album" + "?id=" + id
            getDoc(url).then(doc => {
                const infoEl = doc.querySelector('.m-info ')
                let cover = infoEl.querySelector('.u-cover img').getAttribute('src')
                const title = infoEl.querySelector('.tit').textContent.trim()
                const introEl = infoEl.querySelectorAll('.intr')
                const artistName = introEl[0].querySelector('span').getAttribute('title')
                const artist = [{ id: 0, name: artistName }]
                let publishTime = ''
                let company = ''
                let about = ''
                if (introEl.length > 1) {
                    publishTime = introEl[1].lastChild.textContent
                }
                if (introEl.length > 2) {
                    company = introEl[2].lastChild.textContent
                }

                let pEl = doc.querySelector('.n-albdesc #album-desc-more')
                if (!pEl) {
                    pEl = doc.querySelector('.n-albdesc #album-desc-dot')
                }
                if (pEl) {
                    about = pEl.innerHTML
                }

                cover = cover.replace('177y177', '1024y1024')
                const result = new Album(id, NetEase.CODE, title, cover, artist, company, publishTime, about)

                const predata = doc.querySelector('#song-list-pre-data')
                if (predata) {
                    const json = JSON.parse(predata.textContent)
                    json.forEach(item => {
                        const trackArtist = []
                        item.artists.forEach(ar => trackArtist.push({ id: ar.id, name: ar.name }))
                        const album = { id, name: title }
                        const trackCover = item.album.picUrl
                        const track = new Track(item.id, NetEase.CODE, item.name, trackArtist, album, item.duration, trackCover)
                        track.mv = item.mvid
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 1)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const list = json.result.songs
                const data = list.map(item => {
                    const artist = item.ar.map(e => ({ id: e.id, name: e.name }))
                    const album = { id: item.al.id, name: item.al.name }
                    const track = new Track(item.id, NetEase.CODE, item.name, artist, album, item.dt, item.al.picUrl)
                    track.mv = item.mv
                    return track
                })
                const result = { platform: NetEase.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 1000)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const list = json.result.playlists
                const data = list.map(item => {
                    const playlist = new Playlist(item.id, NetEase.CODE, item.coverImgUrl, item.name)
                    return playlist
                })
                const result = { platform: NetEase.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 10)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const list = json.result.albums
                const data = list.map(item => {
                    const album = new Album(item.id, NetEase.CODE, item.name, item.picUrl)
                    album.publishTime = toYmd(item.publishTime)
                    return album
                })
                const result = { platform: NetEase.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 100)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const list = json.result.artists
                const result = { platform: NetEase.CODE, offset, limit, page, data: [] }
                if (list) {
                    result.data = list.map(item => ({
                        id: item.id,
                        platform: NetEase.CODE,
                        title: item.name,
                        cover: (item.picUrl + "?param=500y500")
                    }))
                }
                resolve(result)
            })
        })
    }

    //歌手分类
    static artistCategories() {
        return new Promise((resolve, reject) => {
            const result = { platform: NetEase.CODE, data: [], alphabet: NetEase.getAlphabetCategory() }
            const url = 'https://music.163.com/discover/artist'
            getDoc(url).then(doc => {
                const els = doc.querySelectorAll('#singer-cat-nav li')
                const category = new Category('默认')
                result.data.push(category)
                els.forEach(el => {
                    const aEl = el.querySelector('a')
                    const href = aEl.getAttribute('href').trim()
                    const dataAttr = aEl.getAttribute('data-cat')
                    const name = aEl.textContent.trim()
                    let value = dataAttr ? dataAttr.trim() : '0'
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
        category.add('全部', '-1')
        category.add('其他', '0')
        const array = alphabet.split('')
        for (var i = 0; i < array.length; i++) {
            category.add(array[i], array[i].charCodeAt(0))
        }
        return category
    }

    //提取分类
    static parseArtistCate(cate) {
        const result = { id: -1, initial: -1 }
        try {
            const source = {
                id: cate['默认'].item.value,
                initial: cate['字母'].item.value
            }
            return Object.assign(result, source)
        } catch (e) {
            //console.log(e)
        }
        return result
    }

    //歌手(列表)广场
    static artistSquare(cate, offset, limit, page) {
        //提取分类
        const resolvedCate = NetEase.parseArtistCate(cate)
        //分类ID
        const cateId = parseInt(resolvedCate.id)
        //推荐歌手
        if (cateId < 1) return NetEase.recommandArtists(cate, offset, limit, page)
        //入驻歌手
        else if (cateId == 5001) return NetEase.signedArtists(cate, offset, limit, page)
        //其他歌手分类
        return new Promise((resolve, reject) => {
            const result = { platform: NetEase.CODE, cate, offset, limit, page, total: 0, data: [] }
            const url = 'https://music.163.com/discover/artist/cat'
            const reqBody = {
                id: cateId,
                initial: resolvedCate.initial
            }
            getDoc(url, reqBody).then(doc => {
                const els = doc.querySelectorAll('.m-sgerlist li')
                els.forEach(el => {
                    let cover = null
                    const coverEl = el.querySelector('.u-cover')
                    if (coverEl) {
                        cover = coverEl.querySelector('img').getAttribute('src')
                            .replace("130y130", "500y500")
                    }
                    const aEl = el.querySelector('.nm')
                    const id = aEl.getAttribute('href').split('?id=')[1]
                    const title = aEl.textContent
                    const artist = { id, platform: NetEase.CODE, title, cover }
                    result.data.push(artist)
                })
                resolve(result)
            })
        })
    }

    //热门歌手
    static topArtists() {
        return new Promise((resolve, reject) => {
            const url = 'https://music.163.com/weapi/artist/top'
            const param = {
                offset: 0,
                total: true,
                limit: 100,
                csrf_token: ''
            }
            const reqBody = weapi(param)
            const result = []
            postJson(url, reqBody).then(json => {
                const list = json.artists
                list.forEach(item => {
                    const id = item.id
                    const title = item.name
                    const cover = item.picUrl
                    const artist = { id, platform: NetEase.CODE, title, cover }
                    result.push(artist)
                    resolve(result)
                })
            })
        })
    }

    //推荐歌手
    static recommandArtists(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: NetEase.CODE, cate, offset, limit, page, total: 0, data: [] }
            if (page > 1) { //TODO
                resolve(result)
                return
            }
            const url = 'https://music.163.com/discover/artist/'
            getDoc(url).then(doc => {
                const els = doc.querySelectorAll('.m-sgerlist li')
                els.forEach(el => {
                    let cover = null
                    const coverEl = el.querySelector('.u-cover')
                    if (coverEl) {
                        cover = coverEl.querySelector('img').getAttribute('src')
                            .replace("130y130", "500y500")
                    }
                    const aEl = el.querySelector('.nm')
                    const id = aEl.getAttribute('href').split('?id=')[1]
                    const title = aEl.textContent
                    const artist = { id, platform: NetEase.CODE, title, cover }
                    result.data.push(artist)
                })
                return result
            }).then(result => {
                NetEase.topArtists().then(data => {
                    result.data.push(...data)
                    resolve(result)
                })
            })
        })
    }

    //入驻歌手
    static signedArtists(cate, offset, limit, page) {
        limit = 60
        offset = (page - 1) * limit
        return new Promise((resolve, reject) => {
            const result = { platform: NetEase.CODE, cate, offset, limit, page, total: 0, data: [] }
            //const url = 'https://music.163.com/discover/artist/signed'
            const url = 'https://music.163.com/weapi/artist/list'
            const param = {
                categoryCode: '5001',
                offset,
                total: false,
                limit,
                csrf_token: ''
            }
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const list = json.artists
                list.forEach(item => {
                    const id = item.id
                    const title = item.name
                    const cover = item.picUrl
                    const artist = { id, platform: NetEase.CODE, title, cover }
                    result.data.push(artist)
                })
                resolve(result)
            })
        })
    }

    static radioCategories() {
        return NetEase.anchorRadioCategories()
    }

    static radioSquare(cate, offset, limit, page, order) {
        return NetEase.anchorRadioSquare(cate, offset, limit, page, order)
    }

    static anchorRadioCategories() {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/discover/djradio"
            getDoc(url).then(doc => {
                const result = { platform: NetEase.CODE, data: [], orders: [] }
                const category = new Category("分类")
                result.data.push(category)

                const listEl = doc.querySelectorAll("#id-category-box .f-cb li")
                listEl.forEach(el => {
                    const text = el.querySelector("em").textContent
                    if (['常见问题', '我要做主播'].indexOf(text) > -1) return
                    const href = el.querySelector("a").getAttribute("href")
                    const value = href.split("?id=")[1]
                    category.add(text, value)
                })
                result.orders.push(...[{
                    key: "上升最快",
                    value: 1
                }, {
                    key: "最热电台",
                    value: 2
                }])
                resolve(result)
            })
        })
    }

    static anchorRadioSquare(cate, offset, limit, page, order) {
        order = order || 1
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/discover/djradio/category"
                + "?id=" + cate + "&order=" + order + "&_hash=allradios"
                + "&limit=" + limit + "&offset=" + offset

            getDoc(url).then(doc => {
                const result = { platform: NetEase.CODE, cate, offset, limit, page, total: 0, data: [] }
                //优质新电台
                let listEl = null
                if (page == 1) {
                    listEl = doc.querySelectorAll(".m-radio > .new li")
                    listEl.forEach(el => {
                        let id = null, cover = null, title = null, itemUrl = null

                        const coverEl = el.querySelector(".u-cover img")
                        const titleEl = el.querySelector(".f-fs2 a")

                        if (coverEl) {
                            cover = coverEl.getAttribute("src").replace("200y200", "500y500")
                        }

                        if (titleEl) {
                            title = titleEl.textContent
                            itemUrl = BASE_URL + titleEl.getAttribute('href')
                            id = Playlist.ANCHOR_RADIO_ID_PREFIX + itemUrl.split('=')[1]
                        }

                        if (id && itemUrl) {
                            const detail = new Playlist(id, NetEase.CODE, cover, title, itemUrl)
                            result.data.push(detail)
                        }
                    })
                }
                const pgEls = doc.querySelectorAll("#allradios .u-page .zpgi")
                if (pgEls && pgEls.length > 0) {
                    const totalEl = pgEls[pgEls.length - 1]
                    if (totalEl) result.total = parseInt(totalEl.textContent)
                }

                //电台排行榜
                listEl = doc.querySelectorAll("#allradios .rdilist li")
                listEl.forEach(el => {
                    let id = null, cover = null, title = null, itemUrl = null

                    const coverEl = el.querySelector(".u-cover img")
                    const titleEl = el.querySelector(".cnt .f-fs3 a")

                    if (coverEl) {
                        cover = coverEl.getAttribute("src").replace("200y200", "500y500")
                    }

                    if (titleEl) {
                        title = titleEl.textContent
                        itemUrl = BASE_URL + titleEl.getAttribute('href')
                        id = Playlist.ANCHOR_RADIO_ID_PREFIX + itemUrl.split('=')[1]
                    }

                    if (id && itemUrl) {
                        const detail = new Playlist(id, NetEase.CODE, cover, title, itemUrl)
                        result.data.push(detail)
                    }
                })
                resolve(result)
            })
        })
    }

    static anchorRadioDetail(id, offset, limit, page) {
        const resolvedId = id.replace(Playlist.ANCHOR_RADIO_ID_PREFIX, "")
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/djradio?id=" + resolvedId
                + "&order=1&_hash=programlist&limit=100&offset=" + ((page - 1) * 100)
            getDoc(url).then(doc => {
                const coverEl = doc.querySelector(".m-info .cover img")
                const title = doc.querySelector(".m-info .tit").textContent.trim()
                const about = doc.querySelector(".m-info .intr").textContent.trim()
                const result = new Playlist(id, NetEase.CODE, null, title, url, about)
                result.type = Playlist.ANCHOR_RADIO_TYPE
                if (coverEl) {
                    const cover = coverEl.getAttribute("src").replace("200y200", "500y500")
                    result.cover = cover
                }
                const subtitleEl = doc.querySelector(".n-songtb .u-title .sub")
                if (subtitleEl) {
                    const subtitle = subtitleEl.textContent.replace('共', '').replace('期', '').trim()
                    result.total = parseInt(subtitle)
                }

                const artistName = doc.querySelector(".cnt .name").textContent.trim()
                const trEls = doc.querySelectorAll('.n-songtb tbody tr')
                trEls.forEach(trEl => {
                    const songlistId = trEl.getAttribute("id").replace('songlist-', '')
                    const tid = NetEase.RADIO_PREFIX + trEl.querySelector(".tt a").getAttribute("href").split("=")[1]
                    const tTitle = trEl.querySelector(".tt a").getAttribute("title")
                    const artist = [{ id: '', name: artistName }]
                    const album = { id, name: title }
                    const duration = toMillis(trEl.querySelector(".f-pr .s-fc4").textContent)
                    const updateTime = trEl.querySelector(".col5 .s-fc4").textContent

                    const track = new Track(tid, NetEase.CODE, tTitle, artist, album, duration, result.cover)
                    track.type = result.type
                    track.pid = id
                    track.songlistId = songlistId
                    track.extra2 = updateTime
                    track.lyric.addLine('999:99.000', about)

                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    static resolveAnchorRadio(id, track) {
        return new Promise((resolve, reject) => {
            if (id.toString().startsWith(NetEase.RADIO_PREFIX)) id = track.songlistId
            resolve(id)
        })
    }

    //视频播放详情：url、cover等
    static videoDetail(id, quality) {
        //quality = quality || 1080
        return new Promise((resolve, reject) => {
            let url = "https://music.163.com/weapi/v1/mv/detail?csrf_token="
            let param = {
                id,
                type: 'MP4',
                csrf_token: ""
            }
            let reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                let maxQuality = 0
                json.data.brs.forEach(item => {
                    maxQuality = Math.max(maxQuality, item.br)
                })
                maxQuality = maxQuality || 1080
                url = "https://music.163.com/weapi/song/enhance/play/mv/url?csrf_token="
                param = {
                    id,
                    r: maxQuality,
                    csrf_token: ""
                }
                reqBody = weapi(param)
                postJson(url, reqBody).then(json => {
                    const result = { id, platform: NetEase.CODE, quality, url: '' }
                    result.url = json.data.url
                    resolve(result)
                })
            })
        })
    }

}