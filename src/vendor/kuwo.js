import { getDoc, postJson, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toMMssSSS } from "../common/Times";
import { Album } from "../common/Album";
import { randomTextWithinAlphabetNums } from "../common/Utils";



//e2db8a61-afdb-11ec-9d7b-c9324a8678ec
//efe8c650-de5c-11ec-9d92-a133baea2d31
//8-4-4-4-12
const randomReqId = () => {
    return (randomTextWithinAlphabetNums(8)
        + '-' + randomTextWithinAlphabetNums(4)
        + '-' + randomTextWithinAlphabetNums(4)
        + '-' + randomTextWithinAlphabetNums(4)
        + '-' + randomTextWithinAlphabetNums(12)).toLowerCase()
}

//const REQ_ID = randomReqId()

const CONFIG = {
    withCredentials: true
}

export class KuWo {
    static CODE = 'kuwo'
    static TOPLIST_CODE = 'KW_RANKLIST'
    static TOPLIST_PREFIX = 'TOP_'
    static CACHE_TOPLISTS = new Map()

    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, data: [], orders: [] }
            const url = "https://www.kuwo.cn/api/www/playlist/getTagList"
                + "?httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const defaultCategory = new Category("精选")
                defaultCategory.add("最新", '#new')
                defaultCategory.add("最热", '#hot')
                result.data.push(defaultCategory)

                const cateArray = json.data
                cateArray.forEach(cate => {
                    const category = new Category(cate.name)
                    const cateItems = cate.data
                    cateItems.forEach(item => {
                        category.add(item.name, item.id)
                    })
                    if (category.data.length > 0) {
                        result.data.push(category)
                    }
                })
                const firstCate = result.data[0]
                firstCate.data.splice(2, 0, { key: '排行榜', value: KuWo.TOPLIST_CODE })
                resolve(result)
            })
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || "").toString().trim()
        resolvedCate = resolvedCate.length > 0 ? resolvedCate : "#new"
        if (resolvedCate == KuWo.TOPLIST_CODE) return KuWo.toplist(cate, offset, limit, page)
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, cate: originCate, offset, limit, page, total: 0, data: [] }
            let url = null
            if (resolvedCate.startsWith('#')) {
                resolvedCate = resolvedCate.substring(1)
                url = "https://www.kuwo.cn/api/www/classify/playlist/getRcmPlayList"
                    + "?pn=" + page + "&rn=" + limit
                    + "&order=" + resolvedCate + "&httpsStatus=1&reqId=" + randomReqId()
            } else {
                url = "https://www.kuwo.cn/api/www/classify/playlist/getTagPlayList"
                    + "?pn=" + page + "&rn=" + limit
                    + "&id=" + resolvedCate + "&httpsStatus=1&reqId=" + randomReqId()
            }
            getJson(url, null, CONFIG).then(json => {
                const pagination = json.data
                //const page = pagination.pn
                const data = pagination.data
                result.total = Math.ceil(pagination.total / limit)

                data.forEach(item => {
                    const id = item.id
                    const cover = item.img
                    const title = item.name

                    if (id) {
                        const playlist = new Playlist(id, KuWo.CODE, cover, title)
                        playlist.total = item.total
                        playlist.listenNum = parseInt(item.listencnt || 0)
                        result.data.push(playlist)
                    }
                })
                resolve(result)
            })
        })
    }

    //排行榜列表
    static toplist(cate, offset, limit, page) {
        return new Promise((resolve) => {
            let result = { platform: KuWo.CODE, cate, offset: 0, limit: 100, page: 1, data: [] }
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "https://www.kuwo.cn/rankList"
            KuWo.CACHE_TOPLISTS.clear()
            getDoc(url).then(doc => {
                let scriptText = doc.querySelector('script').textContent
                let key = 'window.__NUXT__='
                if (scriptText.indexOf(key) != -1) {
                    scriptText = scriptText.split(key)[1]
                    //const json = eval(scriptText)
                    const json = Function('return ' + scriptText)()

                    //参考官方页面
                    const bangList = json.data[0].bangMenu
                    for (var i = 0; i < 3; i++) {
                        const bang = bangList[i]
                        bang.list.forEach(item => {
                            const id = KuWo.TOPLIST_PREFIX + item.sourceid
                            const detail = new Playlist(id, KuWo.CODE, item.pic, item.name)
                            detail.about = item.intro
                            result.data.push(detail)

                            KuWo.CACHE_TOPLISTS.set(id, detail)
                        })
                    }
                }
                resolve(result)
            })
        })
    }

    //排行榜详情
    static toplistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const bangId = id.replace(KuWo.TOPLIST_PREFIX, '').trim()
            const url = "https://www.kuwo.cn/api/www/bang/bang/musicList"
            const reqBody = {
                bangId,
                pn: page,
                rn: 300,
                httpsStatus: 1,
                reqId: randomReqId()
            }
            getJson(url, reqBody, CONFIG).then(json => {
                const cache = KuWo.CACHE_TOPLISTS.get(id)
                const result = new Playlist(id, KuWo.CODE)
                if (cache) {
                    result.cover = cache.cover
                    result.title = cache.title
                    result.about = cache.about
                }
                const playlist = json.data.musicList
                playlist.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const cover = item.pic
                    const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        if (id.toString().startsWith(KuWo.TOPLIST_PREFIX)) return this.toplistDetail(id, offset, limit, page)
        return new Promise((resolve, reject) => {
            //TODO 官方 rn = 30
            const url = "https://www.kuwo.cn/api/www/playlist/playListInfo"
                + "?pid=" + id + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            const result = new Playlist(id, KuWo.CODE)
            /*
            result.cover = json.data.img500
            result.title = json.data.name
            result.about = json.data.info
            result.total = json.data.total
            */
            getJson(url, null, CONFIG).then(json => {
                const { img500, img700, img300, info, total } = json.data
                Object.assign(result, {
                    cover: img700 || img500 || img300,
                    title: json.data.name,
                    about: info,
                    total: Math.ceil(total / 30)
                })
                const playlist = json.data.musicList
                playlist.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const cover = item.pic
                    const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                    if (item.hasmv == 1) track.mv = item.rid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            }).catch(error => {
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kuwo.cn/api/v1/www/music/playUrl"
                + "?mid=" + id + "&type=music" + "&httpsStatus=1&reqId=" + randomReqId()
            const result = new Track(id, KuWo.CODE)
            getJson(url, null, CONFIG).then(json => {
                if (json.data) Object.assign(result, { url: json.data.url })
                resolve(result)
            }).catch(error => {
                resolve(result)
            })
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const url = "http://m.kuwo.cn/newh5/singles/songinfoandlrc"
                + "?musicId=" + id + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const result = { id, platform: KuWo.CODE, lyric: new Lyric(), trans: null }
                if (!json.data) {
                    resolve(result)
                    return
                }
                const lrclist = json.data.lrclist
                if (lrclist) {
                    lrclist.forEach(lineObj => {
                        const mmssSSS = toMMssSSS(lineObj.time * 1000)
                        const text = lineObj.lineLyric
                        result.lyric.addLine(mmssSSS, text)
                    })
                }
                resolve(result)
            })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            let url = "http://www.kuwo.cn/singer_detail/" + id
            getDoc(url).then(doc => {
                let title = '', cover = '', about = ''

                let scriptText = doc.querySelector('script').textContent
                let key = 'window.__NUXT__='
                if (scriptText.indexOf(key) != -1) {
                    scriptText = scriptText.split(key)[1]
                    //const json = eval(scriptText)
                    const json = Function('return ' + scriptText)()

                    const singerInfo = json.data[0].singerInfo
                    title = singerInfo.name
                    cover = singerInfo.pic300
                    about = singerInfo.info
                }
                const result = { id, title, cover, about }
                resolve(result)
            })
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "http://www.kuwo.cn/api/www/artist/artistMusic"
                + "?artistid=" + id + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const total = json.data.total
                const data = []
                const list = json.data.list
                list.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const cover = item.pic
                    const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                    if (item.hasmv) track.mv = item.rid
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
            const url = "http://www.kuwo.cn/api/www/artist/artistAlbum"
                + "?artistid=" + id + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const total = json.data.total
                const data = []
                const list = json.data.albumList
                list.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = new Album(item.albumid, KuWo.CODE, item.album, item.pic, artist,
                        null, item.releaseDate, item.albuminfo)
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
            const url = "http://www.kuwo.cn/album_detail/" + id
            getDoc(url).then(doc => {
                let name = '', cover = '', artist = [], company = '', publishTime = '', about = '', data = []

                let scriptText = doc.querySelector('script').textContent
                let key = 'window.__NUXT__='
                if (scriptText.indexOf(key) != -1) {
                    scriptText = scriptText.split(key)[1]
                    //const json = eval(scriptText)
                    const json = Function('return ' + scriptText)()

                    const pageData = json.data[0].pageData
                    const albumInfo = json.data[0].albumInfo

                    name = albumInfo.album
                    cover = albumInfo.pic
                    artist.push({ id: albumInfo.artistid, name: albumInfo.artist })
                    publishTime = albumInfo.releaseDate
                    about = albumInfo.albuminfo

                    albumInfo.musicList.forEach(item => {
                        const trackArtist = [{ id: item.artistid, name: item.artist }]
                        const trackAlbum = { id: item.albumid, name: item.album }
                        const duration = item.duration * 1000
                        const track = new Track(item.rid, KuWo.CODE, item.name, trackArtist, trackAlbum, duration, item.pic)
                        if (item.hasmv) track.mv = item.rid
                        data.push(track)
                    })
                }
                const result = new Album(id, KuWo.CODE, name, cover, artist,
                    company, publishTime, about, data)
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return KuWo.searchSongs_v0(keyword, offset, limit, page)
    }

    //搜索: 歌曲
    static searchSongs_v0(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = "https://www.kuwo.cn/api/www/search/searchMusicBykeyWord"
                + "?key=" + keyword + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            const result = { platform: KuWo.CODE, offset, limit, page, data: [] }
            getJson(url, null, CONFIG).then(json => {
                if (json.code == 200) {
                    const data = json.data.list.map(item => {
                        const artist = [{ id: item.artistid, name: item.artist }]
                        const album = { id: item.albumid, name: item.album }
                        const duration = item.duration * 1000
                        const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, item.pic)
                        if (item.hasmv) track.mv = item.rid
                        return track
                    })
                    if (data && data.length > 0) result.data.push(...data)
                }
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //搜索: 歌曲
    static searchSongs_v1(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = 'http://search.kuwo.cn/r.s'
                + '?user=7cd972c0119949e98ebd20f18d508f62&idfa=&'
                + 'openudid=2057708153c9fc13f0e801c14d39af5fccdfdc60'
                + '&uuid=7cd972c0119949e98ebd20f18d508f62'
                + '&prod=kwplayer_mc_1.7.3&corp=kuwo'
                + '&source=kwplayer_mc_1.7.3&uid=2557120276'
                + '&ver=kwplayer_mc_1.7.3&loginid=0'
                + '&client=kt&cluster=0&strategy=2012'
                + '&ver=mbox&show_copyright_off=1'
                + '&encoding=utf8&rformat=json'
                + '&mobi=1&vipver=1'
                + `&pn=0&rn=${limit}`
                + `&all=${keyword}&ft=music`
            const result = { platform: KuWo.CODE, offset, limit, page, data: [] }
            getJson(url, null, CONFIG).then(json => {
                const list = json.abslist
                const data = list.map(item => {
                    const artist = [{ id: item.ARTISTID, name: item.ARTIST }]
                    const album = { id: item.ALBUMID, name: item.ALBUM }
                    const duration = parseInt(item.DURATION) * 1000
                    const id = item.MUSICRID.replace('MUSIC_', '')
                    const track = new Track(id, KuWo.CODE, item.SONGNAME, artist, album, duration)
                    if (item.MVFLAG == "1") track.mv = id
                    return track
                })
                if (data && data.length > 0) result.data.push(...data)
                resolve(result)
            }).catch(error => resolve(result))
        })
    }


    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kuwo.cn/api/www/search/searchPlayListBykeyWord"
                + "?key=" + keyword + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const data = json.data.list.map(item => {
                    const playlist = new Playlist(item.id, KuWo.CODE, item.img, item.name)
                    return playlist
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kuwo.cn/api/www/search/searchAlbumBykeyWord"
                + "?key=" + keyword + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const data = json.data.albumList.map(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const albumName = item.album
                    const album = new Album(item.albumid, KuWo.CODE, albumName, item.pic, artist)
                    album.publishTime = item.releaseDate
                    return album
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kuwo.cn/api/www/search/searchArtistBykeyWord"
                + "?key=" + keyword + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
            getJson(url, null, CONFIG).then(json => {
                const data = json.data.artistList.map(item => {
                    return {
                        id: item.id,
                        platform: KuWo.CODE,
                        title: item.name,
                        cover: item.pic300
                    }
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //歌手分类
    static artistCategories() {
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, data: [], alphabet: new Category('字母') }
            const url = "https://www.kuwo.cn/singers"
            getDoc(url).then(doc => {
                let els = doc.querySelectorAll(".main_con .tag_en li")
                els.forEach(el => {
                    const key = el.textContent.trim()
                    const value = key.replace('热门', '')
                    result.alphabet.add(key, value)
                })

                const category = new Category('默认')
                result.data.push(category)
                els = doc.querySelectorAll(".main_con .tag_kind li")
                for (var i = 0; i < els.length; i++) {
                    const key = els[i].textContent.trim()
                    const value = i
                    category.add(key, value)
                }
                resolve(result)
            })
        })
    }

    //提取分类
    static parseArtistCate(cate) {
        const result = { category: 0, prefix: '' }
        try {
            const source = {
                category: cate['默认'].item.value,
                prefix: encodeURIComponent(cate['字母'].item.value)
            }
            return Object.assign(result, source)
        } catch (error) {
            //console.log(error)
        }
        return result
    }

    //歌手(列表)广场
    static artistSquare(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, cate, offset, limit, page, total: 0, data: [] }
            const url = 'https://www.kuwo.cn/api/www/artist/artistInfo'
            const resolvedCate = KuWo.parseArtistCate(cate)
            const reqBody = {
                category: resolvedCate.category,
                prefix: '' + resolvedCate.prefix,
                pn: page,
                rn: 102,
                httpsStatus: 1,
                reqId: randomReqId()
            }
            getJson(url, reqBody).then(json => {
                const list = json.data.artistList
                list.forEach(item => {
                    const id = item.id
                    const title = item.name
                    const cover = item.pic300 || item.pic || item.pic120 || item.pic70
                    const artist = { id, platform: KuWo.CODE, title, cover }
                    result.data.push(artist)
                })
                resolve(result)
            })
        })
    }

    static videoDetail(id, quality) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kuwo.cn/api/v1/www/music/playUrl"
                + `?mid=${id}&type=mv&httpsStatus=1&reqId=${randomReqId()}`
            getJson(url).then(json => {
                const result = { id, platform: KuWo.CODE, quality, url: '' }
                if (json.data) result.url = json.data.url || ''
                resolve(result)
            })
        })
    }

}