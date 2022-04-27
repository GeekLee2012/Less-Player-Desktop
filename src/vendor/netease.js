import { getDoc, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { toYmd } from "../common/Times";
import { Lyric } from "../common/Lyric";
import forge from 'node-forge';
import { Album } from "../common/Album";
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

const randomText = (src, len) => {
    let result = []
    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * (src.length - 1))
        result.push(src.charAt(index))
    }
    return result.join('')
}

const rsaEncrypt = (src, publicKey, modulus) => {
    src = src.split('').reverse().join('')

    const m = new forge.jsbn.BigInteger(modulus, 16)
    const k = new forge.jsbn.BigInteger(publicKey, 16)
    const s = new forge.jsbn.BigInteger(forge.util.bytesToHex(src), 16)

    return s.modPow(k, m).toString(16).padStart(256, '0')
}

const aesEncrypt = (src, secKey, iv) => {
    secKey = CryptoJS.enc.Utf8.parse(secKey)
    iv = CryptoJS.enc.Utf8.parse(iv)
    return CryptoJS.AES.encrypt(src, secKey, { iv, mode: CryptoJS.mode.CBC })
}

const weapi = (text) => {
    if(typeof(text) == 'object')  text = JSON.stringify(text)
    let secretkey = randomText(CHOICE, 16)
    let base64Text = aesEncrypt(text, NONCE, IV).toString()
    const params = aesEncrypt(base64Text, secretkey, IV).toString()
    const encSecKey = rsaEncrypt(secretkey, PUBLIC_KEY, MODULUS)
    return {  params, encSecKey }
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
    return {  c: JSON.stringify(c), ids: JSON.stringify(ids) }
}

const playParam = (id) => {
    return {
        ids: [ id ], 
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
        csrf_token: ""
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
DEFAULT_CATE.add("全部分类", '')

export class NetEase {
    static CODE = 'netease'
    //全部分类
    static categories() {
        return new Promise((resolve) => {
            const url = "https://music.163.com/discover/playlist"
            getDoc(url).then(doc => {
                const result = [ DEFAULT_CATE ]

                const listEl = doc.querySelectorAll("#cateListBox .f-cb")
                listEl.forEach(el => {
                    const cate = el.querySelector("dt").textContent
                    const category = new Category(cate)
                    const fcEls = el.querySelectorAll(".s-fc1")
                    fcEls.forEach(item => {
                        const text = item.textContent
                        category.add(text, text)
                    })
                    result.push(category)
                });
                resolve(result)
            })
        })
    }

    //歌单(列表)广场
    static square (cate, offset, limit, page) {
        return new Promise((resolve) => {
            const url = "https://music.163.com/discover/playlist"
                + "?cat=" + cate + "&order=hot"
                + "&limit=" + limit + "&offset=" + offset;
            getDoc(url).then(doc => {
                const result = { offset, limit, page, data: [] }
                const listEl = doc.querySelectorAll("#m-pl-container li")
                listEl.forEach(el => {
                    let id = null, cover = null, title = null, itemUrl = null

                    const coverEl = el.querySelector(".u-cover img")
                    const titleEl = el.querySelector(".dec a")

                    if(coverEl) {
                        cover = coverEl.getAttribute("src").replace("140y140", "500y500")
                    }

                    if(titleEl) {
                        title = titleEl.textContent
                        itemUrl = BASE_URL + titleEl.getAttribute('href')
                        id = itemUrl.split('=')[1]
                    }

                    if(id && itemUrl) {
                        const detail = new Playlist(id, NetEase.CODE , cover, title, itemUrl)
                        result.data.push(detail)
                    }
                });
                //console.log(result)
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
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

                url = "https://music.163.com/weapi/v3/song/detail"
                param = trackIdsParam(ids.slice(offset, limit))
                //console.log(param)
                reqBody = weapi(param)
                postJson(url, reqBody).then(json => {
                    const songs = json.songs
                    songs.forEach(song => {
                        const artist = []
                        song.ar.forEach(e => artist.push({id: e.id, name: e.name }))
                        const album = { id: song.al.id, name: song.al.name }
                        const track = new Track(song.id, NetEase.CODE, song.name, artist, album, song.dt, song.al.picUrl)
                        result.addTrack(track)
                    })
                    resolve(result)
                })
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token="
            const param = playParam(id)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const result = new Track()
                const song = json.data[0]
                result.id = song.id
                result.url = song.url
                resolve(result)
            })
        })
    }

    //歌词
    static lyric(id) {
        return new Promise((resolve, reject) => {
            const url = "https://music.163.com/weapi/song/lyric?csrf_token="
            const param = lyricParam(id);
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const lyric = json.lrc.lyric
                //console.log(lyric)
                if(lyric) {
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
            const url = "https://music.163.com/artist" + "?id=" + id
            getDoc(url).then(doc => {
                const name = doc.querySelector("#artist-name").textContent
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
                    const album = {  id: itemAlbum.id,  name: itemAlbum.name }
                    const albumCover = itemAlbum.picUrl

                    const track = new Track(item.id, NetEase.CODE, item.name, 
                        artist, album, item.duration, albumCover)
                        data.push(track)
                })

                const result = { id, name, cover, data }
                resolve(result)
            })
        })
    }

    //歌手详情：热门歌曲
    static artistDetailHotSongs(id) {
        return NetEase.artistDetail(id)
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
                const result = doc.querySelector(".n-artdesc").innerHTML
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
                const cover = infoEl.querySelector('.u-cover img').getAttribute('src')
                const title = infoEl.querySelector('.tit').textContent.trim()
                const introEl = infoEl.querySelectorAll('.intr')
                const artistName = introEl[0].querySelector('span').getAttribute('title')
                const artist = [ { id: 0, name: artistName } ]
                let publishTime = ''
                let company = ''
                let about = ''
                if(introEl.length > 1) {
                    console.log(introEl[1])
                    publishTime = introEl[1].lastChild.textContent
                }
                if(introEl.length > 2) {
                    company = introEl[2].lastChild.textContent
                }

                let pEl = doc.querySelector('.n-albdesc #album-desc-more')
                if(!pEl) {
                    pEl = doc.querySelector('.n-albdesc #album-desc-dot')
                }
                if(pEl) {
                    about = pEl.innerHTML
                }
                
                const result = new Album(id, NetEase.CODE, title, cover, artist, company, publishTime, about)
                
                const predata = doc.querySelector('#song-list-pre-data')
                if(predata) {
                    const json = JSON.parse(predata.textContent)
                    json.forEach(item => {
                        const trackArtist = []
                        item.artists.forEach(ar => trackArtist.push({ id: ar.id, name: ar.name }))
                        const album = { id, name: title }
                        const trackCover = item.album.picUrl
                        const track = new Track(item.id, NetEase.CODE, item.name, trackArtist, album, item.duration, trackCover)
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
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 1)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                const data = json.result.songs.map(item => {
                    const artist = item.ar.map(e => ({ id: e.id, name: e.name }))
                    const album = { id: item.al.id, name : item.al.name }
                    const track = new Track(item.id, NetEase.CODE, item.name, artist, album, item.dt, item.al.picUrl)
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
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 1000)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                console.log(json)
                const data = json.result.playlists.map(item => {
                    const playlist = new Playlist(item.id, NetEase.CODE, item.coverImgUrl, item.name)
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
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 10)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                console.log(json)
                const data = json.result.albums.map(item => {
                    const album = new Album(item.id, NetEase.CODE, item.name, item.picUrl)
                    album.publishTime = toYmd(item.publishTime)
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
            const url = "https://music.163.com/weapi/cloudsearch/get/web"
            const param = searchParam(keyword, 100)
            const reqBody = weapi(param)
            postJson(url, reqBody).then(json => {
                console.log(json)
                const data = json.result.artists.map(item => ({
                    id: item.id,
                    platform: NetEase.CODE,
                    title: item.name,
                    cover: item.picUrl
                }))
                const result = { offset, limit, page, data }
                resolve(result)
            })
        }) 
    }

}