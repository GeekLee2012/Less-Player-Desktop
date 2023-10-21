import { getDoc, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { toMMssSSS } from "../common/Times";
import { Album } from "../common/Album";
import { randomTextWithinAlphabetNums } from "../common/Utils";
import { useSettingStore } from "../renderer/store/settingStore";



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

const KW_DEFAULT_COVER_URIS = ['/star/albumcover/300/30/92/3189025836.jpg']

const getCoverByQuality = (url) => {
    if (!url) return url
    const { getImageUrlByQuality } = useSettingStore()
    return getImageUrlByQuality([
        url.replace('_500.', '_300.'),
        url,
        url.replace('_500.', '_1000.')
    ])
}

const getAlbumCoverByQuality = (url) => {
    if (!url) return url
    if (KW_DEFAULT_COVER_URIS.findIndex(uri => (url.includes(uri))) != -1) {
        return null
    }
    const { getImageUrlByQuality } = useSettingStore()
    return getImageUrlByQuality([
        url.replace('/albumcover/500/', '/albumcover/300/'),
        url,
        url.replace('/albumcover/500/', '/albumcover/1000/'),
    ])
}

const getArtistCoverByQuality = (url) => {
    if (!url) return url
    const { getImageUrlByQuality } = useSettingStore()
    return getImageUrlByQuality([
        url.replace('/starheads/300/', '/starheads/120/'),
        url,
        url.replace('/starheads/300/', '/starheads/500/'),
    ])
}

const getSearchCoverByQuality = (url) => {
    if (!url) return url
    const { getImageUrlByQuality } = useSettingStore()
    return getImageUrlByQuality([
        url.replace('_700.', '_150.'),
        url.replace('_150.', '_500.').replace('_700.', '_500.'),
        url.replace('_150.', '_500.'),
    ])
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
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/playlist/getTagList?httpsStatus=1&reqId=${reqId}&plat=web_www`
            getJson(url, null, CONFIG).then(json => {
                const cateArray = json.data || []

                if (cateArray && cateArray.length > 0) {
                    const defaultCategory = new Category('精选')
                    defaultCategory.add('最新', '#new')
                    defaultCategory.add('最热', '#hot')
                    result.data.push(defaultCategory)
                }

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

                if (cateArray && cateArray.length > 0) {
                    const firstCate = result.data[0]
                    firstCate.data.splice(2, 0, { key: '排行榜', value: KuWo.TOPLIST_CODE })
                }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || '').toString().trim()
        resolvedCate = resolvedCate.length > 0 ? resolvedCate : '#new'
        if (resolvedCate == KuWo.TOPLIST_CODE) return KuWo.toplist(cate, offset, limit, page)
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, cate: originCate, offset, limit, page, total: 0, data: [] }
            //官方 rn = 20
            /*
            if (resolvedCate.startsWith('#')) {
                resolvedCate = resolvedCate.substring(1)
                url = `https://www.kuwo.cn/api/www/classify/playlist/getRcmPlayList?pn=${page}&rn=${limit}&order=${resolvedCate}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`
            } else {
                url = `https://www.kuwo.cn/api/www/classify/playlist/getTagPlayList?pn=${page}&rn=${limit}&id=${resolvedCate}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`
            }
            */
            /*
            const action = resolvedCate.startsWith('#') ? 'getRcmPlayList' : 'getTagPlayList'
            const cateIdName = resolvedCate.startsWith('#') ? 'order' : 'id'
            resolvedCate = resolvedCate.startsWith('#') ? resolvedCate.substring(1) : resolvedCate
            */

            const reqId = randomReqId()
            let action = 'getTagPlayList', cateIdName = 'id'
            if (resolvedCate.startsWith('#')) { //最新、最热
                resolvedCate = resolvedCate.substring(1)
                action = 'getRcmPlayList'
                cateIdName = 'order'
            }

            const url = `https://www.kuwo.cn/api/www/classify/playlist/${action}?pn=${page}&rn=${limit}&${cateIdName}=${resolvedCate}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`
            getJson(url, null, CONFIG).then(json => {
                const pagination = json.data
                //const page = pagination.pn
                const data = pagination.data
                result.total = Math.ceil(pagination.total / limit)

                data.forEach(item => {
                    const id = item.id
                    const cover = getCoverByQuality(item.img)
                    const title = item.name

                    if (id) {
                        const playlist = new Playlist(id, KuWo.CODE, cover, title)
                        playlist.total = item.total
                        playlist.listenNum = parseInt(item.listencnt || 0)
                        result.data.push(playlist)
                    }
                })
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
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
            const url = 'https://www.kuwo.cn/rankList'
            KuWo.CACHE_TOPLISTS.clear()
            getDoc(url).then(doc => {
                let scriptText = doc.querySelector('script').textContent
                let key = 'window.__NUXT__='
                if (scriptText.indexOf(key) != -1) {
                    scriptText = scriptText.split(key)[1]
                    //const json = eval(scriptText)
                    const json = Function(`return ${scriptText}`)()
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
            const url = 'https://www.kuwo.cn/api/www/bang/bang/musicList'
            const reqBody = {
                bangId,
                pn: page,
                rn: 20,
                httpsStatus: 1,
                reqId: randomReqId(),
                plat: 'web_www',
                from: ''
            }
            const result = new Playlist(id, KuWo.CODE)
            getJson(url, reqBody, CONFIG).then(json => {
                if (json.code != 200) {
                    resolve(result)
                    return
                }
                const cache = KuWo.CACHE_TOPLISTS.get(id)
                if (cache) {
                    result.cover = cache.cover
                    result.title = cache.title
                    result.about = cache.about
                }
                const { num: total, musicList } = json.data
                result.total = total
                const maxPage = Math.ceil(total / 20)
                if (page > maxPage) { // 超出最大页数后，KW居然还返回数据！！！
                    resolve(result)
                    return
                }

                const playlist = musicList
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
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/playlist/playListInfo?pid=${id}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`
            const result = new Playlist(id, KuWo.CODE)
            /*
            result.cover = json.data.img500
            result.title = json.data.name
            result.about = json.data.info
            result.total = json.data.total
            */
            const { getImageUrlByQuality } = useSettingStore()
            getJson(url, null, CONFIG).then(json => {
                const { img500, img700, img300, info, total } = json.data
                Object.assign(result, {
                    cover: getImageUrlByQuality([img300, img500, img700]),
                    title: json.data.name,
                    about: info,
                    total: Math.ceil(total / 30)
                })
                const playlist = json.data.musicList
                playlist.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const cover = getAlbumCoverByQuality(item.pic)

                    const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                    if (item.hasmv == 1) track.mv = item.rid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/v1/www/music/playUrl?mid=${id}&type=music&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`
            const result = new Track(id, KuWo.CODE)
            getJson(url, null, CONFIG).then(json => {
                if (json.data) Object.assign(result, { url: json.data.url })
                resolve(result)
            }, error => resolve(result)).catch(error => resolve(result))
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${id}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const result = { id, platform: KuWo.CODE, lyric: new Lyric(), trans: null }
                if (!json.data) {
                    return resolve(result)
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
            let url = `http://www.kuwo.cn/singer_detail/${id}`
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
                    //cover = singerInfo.pic300
                    cover = getArtistCoverByQuality(singerInfo.pic300)
                    about = singerInfo.info
                }
                const result = { id, title, cover, about }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `http://www.kuwo.cn/api/www/artist/artistMusic?artistid=${id}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const total = json.data.total
                const data = []
                const list = json.data.list
                list.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const album = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const cover = getAlbumCoverByQuality(item.pic)
                    const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                    if (item.hasmv) track.mv = item.rid
                    data.push(track)
                })
                const result = { offset, limit, page, total, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `http://www.kuwo.cn/api/www/artist/artistAlbum?artistid=${id}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}`

            getJson(url, null, CONFIG).then(json => {
                const total = json.data.total
                const data = []
                const list = json.data.albumList
                list.forEach(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const cover = getAlbumCoverByQuality(item.pic)
                    const album = new Album(item.albumid, KuWo.CODE, item.album, cover, artist,
                        null, item.releaseDate, item.albuminfo)
                    data.push(album)
                })
                const result = { offset, limit, page, total, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //专辑详情
    static albumDetail_v0(id) {
        return new Promise((resolve, reject) => {
            const url = `http://www.kuwo.cn/album_detail/${id}`

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
                    cover = getAlbumCoverByQuality(albumInfo.pic)
                    artist.push({ id: albumInfo.artistid, name: albumInfo.artist })
                    publishTime = albumInfo.releaseDate
                    about = albumInfo.albuminfo

                    albumInfo.musicList.forEach(item => {
                        const trackArtist = [{ id: item.artistid, name: item.artist }]
                        const trackAlbum = { id: item.albumid, name: item.album }
                        const duration = item.duration * 1000
                        const trackCover = getAlbumCoverByQuality(item.pic)
                        const track = new Track(item.rid, KuWo.CODE, item.name, trackArtist, trackAlbum, duration, trackCover)
                        if (item.hasmv) track.mv = item.rid
                        data.push(track)
                    })
                }
                const result = new Album(id, KuWo.CODE, name, cover, artist,
                    company, publishTime, about, data)
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise(async (resolve, reject) => {
            let page = 1, limit = 20, totalPage = 1
            let detail = await KuWo.doGetAlbumDetail(id, page++, limit)
            if (!detail) return resolve(null)
            let { album, total, data } = detail
            totalPage = Math.ceil(total / limit)
            while (totalPage >= page) {
                //目前KW太不稳定，经常返回599或430错误，所以数据不宜过多，截断就好
                if (page > 3) break
                detail = await KuWo.doGetAlbumDetail(id, page++, limit)
                if (!detail) return resolve(null)
                data.push(...detail.data)
            }
            const result = album
            album.data = data
            resolve(result)
        })
    }

    //专辑详情
    static doGetAlbumDetail(id, page, limit) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/album/albumInfo?albumId=${id}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www`

            getJson(url).then(json => {
                const artist = [], data = []
                const { album: name, pic, artistid, artist: aArtist, albuminfo: about, musicList, releaseDate: publishTime, total } = json.data
                const cover = getAlbumCoverByQuality(pic)
                artist.push({ id: artistid, name: aArtist })

                musicList.forEach(item => {
                    const trackArtist = [{ id: item.artistid, name: item.artist }]
                    const trackAlbum = { id: item.albumid, name: item.album }
                    const duration = item.duration * 1000
                    const trackCover = getAlbumCoverByQuality(item.pic)
                    const track = new Track(item.rid, KuWo.CODE, item.name, trackArtist, trackAlbum, duration, trackCover)
                    if (item.hasmv) track.mv = item.rid
                    data.push(track)
                })

                const album = new Album(id, KuWo.CODE, name, cover, artist,
                    null, publishTime, about)
                resolve({ album, page, limit, total, data })
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return KuWo.searchSongs_v1(keyword, offset, limit, page)
    }

    //搜索: 歌曲
    static searchSongs_v0(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = "https://www.kuwo.cn/api/www/search/searchMusicBykeyWord"
                + "?key=" + keyword + "&pn=" + page + "&rn=" + limit
                + "&httpsStatus=1&reqId=" + randomReqId()
                + "&plat=web_www&from="
            const result = { platform: KuWo.CODE, offset, limit, page, data: [] }
            getJson(url, null, CONFIG).then(json => {
                if (json.code == 200) {
                    const data = json.data.list.map(item => {
                        const artist = [{ id: item.artistid, name: item.artist }]
                        const album = { id: item.albumid, name: item.album }
                        const duration = item.duration * 1000
                        const cover = getAlbumCoverByQuality(item.pic)
                        const track = new Track(item.rid, KuWo.CODE, item.name, artist, album, duration, cover)
                        if (item.hasmv) track.mv = item.rid
                        return track
                    })
                    if (data && data.length > 0) result.data.push(...data)
                }
                resolve(result)
            }, error => resolve(result)).catch(error => resolve(result))
        })
    }

    //搜索: 歌曲
    static searchSongs_v1(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, offset, limit, page, data: [] }

            keyword = keyword.trim()
            const url = 'http://search.kuwo.cn/r.s'
                + '?user=7cd972c0119949e98ebd20f18d508f62&idfa=&'
                + 'openudid=2057708153c9fc13f0e801c14d39af5fccdfdc60'
                + '&uuid=7cd972c0119949e98ebd20f18d508f62'
                + '&prod=kwplayer_mc_1.7.5&corp=kuwo'
                + '&source=kwplayer_mc_1.7.5&uid=2557120276'
                + '&ver=kwplayer_mc_1.7.3&loginid=0'
                + '&client=kt&cluster=0&strategy=2012'
                + '&ver=mbox&show_copyright_off=1'
                + '&encoding=utf8&rformat=json'
                + '&mobi=1&vipver=1'
                + `&pn=0&rn=${limit}`
                + `&all=${keyword}&ft=music`

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
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/search/searchPlayListBykeyWord?key=${keyword}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const data = json.data.list.map(item => {
                    const cover = getSearchCoverByQuality(item.img)
                    const playlist = new Playlist(item.id, KuWo.CODE, cover, item.name)
                    return playlist
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/search/searchAlbumBykeyWord?key=${keyword}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const data = json.data.albumList.map(item => {
                    const artist = [{ id: item.artistid, name: item.artist }]
                    const albumName = item.album
                    const cover = getAlbumCoverByQuality(item.pic)
                    const album = new Album(item.albumid, KuWo.CODE, albumName, cover, artist)
                    album.publishTime = item.releaseDate
                    return album
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/search/searchArtistBykeyWord?key=${keyword}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const data = json.data.artistList.map(item => {
                    return {
                        id: item.id,
                        platform: KuWo.CODE,
                        title: item.name,
                        //cover: item.pic300
                        cover: getArtistCoverByQuality(item.pic300)
                    }
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //搜索: 视频
    static searchVideos(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/www/search/searchMvBykeyWord?key=${keyword}&pn=${page}&rn=${limit}&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url, null, CONFIG).then(json => {
                const data = json.data.mvlist.map(item => {
                    return {
                        id: item.id,
                        vid: item.id,
                        platform: KuWo.CODE,
                        title: item.name,
                        cover: item.pic,
                        type: Playlist.VIDEO_TYPE,
                        subtitle: item.artist,
                        duration: (item.duration * 1000),
                        listenNum: item.mvPlayCnt
                    }
                })
                const result = { platform: KuWo.CODE, offset, limit, page, data }
                resolve(result)
            }, error => resolve(null)).catch(error => resolve(null))
        })
    }

    //歌手分类
    static artistCategories() {
        return new Promise((resolve, reject) => {
            const result = { platform: KuWo.CODE, data: [], alphabet: new Category('字母') }
            const url = 'https://www.kuwo.cn/singers'

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
                    //const cover = item.pic300 || item.pic || item.pic120 || item.pic70
                    const cover = getArtistCoverByQuality(item.pic300)
                    const artist = { id, platform: KuWo.CODE, title, cover }
                    result.data.push(artist)
                })
                resolve(result)
            })
        })
    }

    static videoDetail(id, quality) {
        return new Promise((resolve, reject) => {
            const reqId = randomReqId()
            const url = `https://www.kuwo.cn/api/v1/www/music/playUrl?mid=${id}&type=mv&httpsStatus=1&reqId=${reqId}&plat=web_www&from=`

            getJson(url).then(json => {
                const result = { id, platform: KuWo.CODE, quality, url: '' }
                if (json.data) result.url = json.data.url || ''
                resolve(result)
            })
        })
    }

}