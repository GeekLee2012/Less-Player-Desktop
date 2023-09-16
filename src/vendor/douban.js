import { getDoc, getJson, postJson, getInternalIpv4 } from "../common/HttpClient";
import { QQ } from "./qq";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { base64Decode, base64Encode, hexDecode, toTrimString } from "../common/Utils";
import { Album } from "../common/Album";


let v4ip = null
const getIpv4 = async () => {
    if (!v4ip) v4ip = await getInternalIpv4()
    return v4ip
}

const moduleReq = (module, method, param) => {
    return { module, method, param }
}

const getAlbumCover = (albummid) => {
    if (!albummid) return null
    return "http://y.gtimg.cn/music/photo_new/T002R500x500M000"
        + albummid + ".jpg"
}

const getArtistCover = (artistmid) => {
    if (!artistmid) return null
    return "http://y.gtimg.cn/music/photo_new/T001R500x500M000"
        + artistmid + ".jpg"
}

const getTrackTypeMeta = (typeName) => {
    return {
        m4a: {
            prefix: 'C400',
            ext: '.m4a',
        },
        128: {
            prefix: 'M500',
            ext: '.mp3',
        },
        320: {
            prefix: 'M800',
            ext: '.mp3',
        },
        ape: {
            prefix: 'A000',
            ext: '.ape',
        },
        flac: {
            prefix: 'F000',
            ext: '.flac',
        }
        /*,
        mgg: {
            prefix: 'O4M000',
            ext: '.mgg',
        }
        */
    }[typeName]
}

//新版本歌词信息
const lyricExtReqBody = (id, track) => {
    const { title, artist, album, duration, songID } = track
    const songName = base64Encode(title)
    const singerName = base64Encode(artist[0].name)
    const albumName = base64Encode(album.name)
    const interval = parseInt(duration / 1000)
    return {
        data: JSON.stringify({
            comm: {
                "tmeAppID": "qqmusic",
                "authst": "",
                "uid": "5019772269",
                "gray": "1",
                "OpenUDID": "2057708153c9fc13f0e801c14d39af5fccdfdc60",
                "ct": "6",
                "patch": "2",
                "sid": "202304202127285019772269",
                "wid": "2722428046011261952",
                "cv": "80605",
                //"gzip" : "1",
                "qq": "",
                "nettype": "2"
            },
            req_1: moduleReq('music.musichallSong.PlayLyricInfo', 'GetPlayLyricInfo',
                {
                    "trans_t": 0,
                    "roma_t": 0,
                    "crypt": 0,
                    "lrc_t": 0,
                    interval,
                    "trans": 1,
                    "ct": 6,
                    singerName,
                    "type": 0,
                    "qrc_t": 0,
                    "cv": 80605,
                    "roma": 1,
                    songID,
                    "qrc": 0,
                    albumName,
                    songName
                })
        })
    }
}

export class DouBan {
    static CODE = 'douban'
    static MHZ_CODE = 'MHZ'
    static TAG_PLAYLIST_CODE = 'T_PLAYLIST'
    static RECOMMAND_BY_EDITOR_CODE = 'R_BY_EDITOR'
    static RECOMMAND_PLAYLIST_CODE = 'R_PLAYLIST'
    static RECOMMAND_ALBUM_CODE = 'R_ALBUM'
    static RECOMMAND_SONGS_CODE = 'R_SONGS'
    static SECTION_SONGS_CODE = 'SECTION_SONGS'
    static MAIN_BG = 'http://doubanfm.kuwo.cn/assets/img/bg.jpg'

    static RADIO_CACHE = { channel: 0, data: [] }

    //全部分类
    static categories() {
        return new Promise(async (resolve, reject) => {
            const result = { platform: DouBan.CODE, data: [], orders: [] }

            const defaultCate = new Category('推荐')
            const tagPlaylistCate = new Category('主题歌单', DouBan.TAG_PLAYLIST_CODE)
            const othersCate = new Category('其他')
            result.data.push(defaultCate)
            result.data.push(tagPlaylistCate)
            result.data.push(othersCate)

            defaultCate.add('主题兆赫', DouBan.MHZ_CODE)
            defaultCate.add('精选歌单', DouBan.RECOMMAND_PLAYLIST_CODE)

            const tagPlaylistCatesJson = await DouBan.tagPlaylistCategories()
            tagPlaylistCatesJson.data.forEach(item => {
                const { name, value } = item
                tagPlaylistCate.add(name, value)
            })

            othersCate.add('编辑精选', DouBan.RECOMMAND_BY_EDITOR_CODE)
            othersCate.add('精选专辑', DouBan.RECOMMAND_ALBUM_CODE)
            othersCate.add('推荐单曲', DouBan.RECOMMAND_SONGS_CODE)
            resolve(result)
        })
    }

    //主题歌单分类
    static tagPlaylistCategories() {
        const result = { platform: DouBan.CODE, data: [] }
        return new Promise(async (resolve, reject) => {
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=ListTag"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.mooSearch.MooSearchServer", "ListTag", {})
            })
            postJson(url, reqBody).then(json => {
                const { tagList } = json.cgi.data
                tagList.forEach(item => {
                    const { tagInfo } = item
                    const { id, name, cover, tag_othername, type } = tagInfo
                    result.data.push({
                        name: tag_othername || name,
                        value: DouBan.TAG_PLAYLIST_CODE + '_' + id,
                        cover,
                        type
                    })
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || '').toString().trim()
        resolvedCate = resolvedCate.length > 0 ? resolvedCate : DouBan.MHZ_CODE
        //主题兆赫
        if (resolvedCate == DouBan.MHZ_CODE) return DouBan.mhzChannels(cate, offset, limit, page)
        //主题歌单
        if (resolvedCate.includes(DouBan.TAG_PLAYLIST_CODE)) return DouBan.tagPlaylists(cate, offset, limit, page)
        //编辑精选
        if (resolvedCate.includes(DouBan.RECOMMAND_BY_EDITOR_CODE)) return DouBan.recommandByEditor(cate, offset, limit, page)
        //精选专辑
        if (resolvedCate.includes(DouBan.RECOMMAND_ALBUM_CODE)) return DouBan.recommandAlbums(cate, offset, limit, page)
        //推荐单曲
        if (resolvedCate.includes(DouBan.RECOMMAND_SONGS_CODE)) return DouBan.recommandSongs(cate, offset, limit, page)

        //精选歌单
        return new Promise(async (resolve, reject) => {
            const result = { platform: DouBan.CODE, cate: originCate, offset, limit, page, total: 10, data: [] }
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=MergePage"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.fmPlaylistPage.fmPlaylistPageSvr", "MergePage", { "offset": offset + (page - 1) * 20 })
            })
            postJson(url, reqBody).then(json => {
                const { lst: list } = json.cgi.data
                list.forEach(item => {
                    const { bizId: id, bizType, title, pic: cover } = item
                    const playlist = new Playlist(id, DouBan.CODE, cover, title)
                    playlist.bizType = bizType
                    result.data.push(playlist)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //暂时用不上
    static playlistRadios(cate, offset, limit, page) {
        return DouBan.mhzChannels(cate, offset, limit, page)
    }

    //兆赫列表，playlistRadios
    static mhzChannels(cate, offset, limit, page) {
        return new Promise(async (resolve, reject) => {
            const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 1, data: [] }
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=RadioPage"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.fmRadio.FmRadioSvr", "RadioPage", { "nouse": 0 })
            })
            postJson(url, reqBody).then(json => {
                const { top, sections } = json.cgi.data
                if (top) {
                    top.forEach(item => {
                        const { id, title1: title, pic: cover, color } = item
                        const playlist = new Playlist(DouBan.MHZ_CODE + '_' + id, DouBan.CODE, null, title)
                        playlist.type = Playlist.NORMAL_RADIO_TYPE
                        const { R, G, B } = color
                        playlist.color = `rgb(${R},${G}, ${B})`
                        result.data.push(playlist)
                    })
                }
                if (sections) {
                    sections.forEach(section => {
                        const { id: sid, title: stitle, radios } = section
                        if (!radios) return
                        radios.forEach(radio => {
                            const { id, title1, title2, color } = radio
                            const title = `${stitle} ｜ ${title1} ${title2}`
                            const playlist = new Playlist(DouBan.MHZ_CODE + '_' + id, DouBan.CODE, null, title)
                            playlist.type = Playlist.NORMAL_RADIO_TYPE
                            const { R, G, B } = color
                            playlist.color = `rgb(${R},${G}, ${B})`
                            result.data.push(playlist)
                        })
                    })
                }
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //主题歌单
    static tagPlaylists(cate, offset, limit, page) {
        const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 100, data: [] }
        const tagId = parseInt((cate || '').replace(DouBan.TAG_PLAYLIST_CODE + '_', '').trim())
        return new Promise(async (resolve, reject) => {
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=ListGenreSongPlayList"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.mooSearch.MooSearchServer", "ListGenreSongPlayList", {
                    "tagId": tagId,
                    "tagType": 1,
                    "startTime": (page - 1)
                })
            })
            postJson(url, reqBody).then(json => {
                const { playlistVec: list } = json.cgi.data
                list.forEach(item => {
                    const { id, playlistType: bizType, title, pic: cover } = item
                    const playlist = new Playlist(id, DouBan.CODE, cover, title)
                    playlist.bizType = bizType
                    result.data.push(playlist)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //推荐单曲
    static recommandSongs(cate, offset, limit, page) {
        const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 1, data: [] }
        return new Promise((resolve, reject) => {
            const list = [{
                id: DouBan.SECTION_SONGS_CODE + '_1',
                title: '宝藏单曲',
                cover: DouBan.MAIN_BG
            }, {
                id: DouBan.SECTION_SONGS_CODE + '_2',
                title: '探索发现',
                cover: DouBan.MAIN_BG
            }]
            list.forEach(item => {
                const { id, title, cover } = item
                const playlist = new Playlist(id, DouBan.CODE, cover, title)
                result.data.push(playlist)
            })
            resolve(result)
        })
    }

    //编辑精选
    static recommandByEditor(cate, offset, limit, page) {
        return new Promise(async (resolve, reject) => {
            const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 1, data: [] }
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=Discover"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                cgi: moduleReq("fm.fmPlaylistPage.fmPlaylistPageSvr", "Discover", {
                    "Pos": 1
                }),
                'Discover': moduleReq("fm.fmPlaylistPage.fmPlaylistPageSvr", "Discover", {
                    "Pos": 2
                })
            })
            postJson(url, reqBody).then(json => {
                const { lst: list1 } = json.cgi.data
                const { lst: list2 } = json.Discover.data
                const list = []
                if (list1) list.push(...list1)
                if (list2) list.push(...list2)

                list.forEach(item => {
                    const { bizId: id, bizType, title, pic: cover } = item
                    const playlist = new Playlist(id, DouBan.CODE, cover, title)
                    playlist.bizType = bizType
                    result.data.push(playlist)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //精选专辑
    static recommandAlbums(cate, offset, limit, page) {
        const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 1, data: [], dataType: 1 }
        //const cateId = parseInt(toTrimString(cate).replace(DouBan.RECOMMAND_ALBUM_CODE + '_', ''))
        return new Promise(async (resolve, reject) => {
            if (page > 1) {
                resolve(result)
                return
            }
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=AlbumMergePage"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.fmDiscover.fmDiscoverAlbumSvr", "AlbumMergePage", { "date": "" })
            })
            postJson(url, reqBody).then(json => {
                const { albums: list } = json.cgi.data
                list.forEach(item => {
                    const { bizId: id, bizType, name: title, pic: cover, subTitle } = item
                    const albumId = DouBan.RECOMMAND_ALBUM_CODE + '_' + id
                    const album = new Album(albumId, DouBan.CODE, title, cover)
                    album.bizType = bizType
                    album.subtitle = subTitle
                    result.data.push(album)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //宝藏单曲、探索发现
    static recommandSectionSongs(id, offset, limit, page) {
        const pos = parseInt(toTrimString(id).replace(DouBan.SECTION_SONGS_CODE + '_', ''))
        const titles = ['未知歌单', '宝藏单曲', '探索发现']
        return new Promise(async (resolve, reject) => {
            const result = new Playlist(id, DouBan.CODE, DouBan.MAIN_BG, titles[pos])
            Object.assign(result, {
                about: '每一次的不期而遇，也许都会有别样的风景。'
                    + '<br>一起去发现美吧，让内心来指引方向。 '
                    + '<br><br>PS: 歌曲数据，在每次页面重新进入后，可能会随时刷新哦 ~'
            })
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=SongSection"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                cgi: moduleReq("fm.fmDiscover.fmDiscoverSvr", "SongSection", {
                    "Pos": pos
                })
            })
            postJson(url, reqBody).then(json => {
                const { songs } = json.cgi.data
                songs.forEach(item => {
                    const { track: song } = item
                    const artist = song.singer.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: song.album.id, name: song.album.title }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.album.mid)
                    const track = new Track(song.id, DouBan.CODE, song.name, artist, album, duration, cover)
                    track.mid = song.mid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        id = toTrimString(id)
        //（歌曲合集）宝藏单曲、探索发现
        if (id.includes(DouBan.SECTION_SONGS_CODE)) return DouBan.recommandSectionSongs(id, offset, limit, page)

        //普通歌单
        id = parseInt(id.replace(DouBan.TAG_PLAYLIST_CODE + '_', ''))
        return new Promise(async (resolve, reject) => {
            const result = new Playlist(id, DouBan.CODE)
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=QueryPlaylistDetailEx"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.mooDetailPage.MooPlaylistDetailSvr", "QueryPlaylistDetailEx", {
                    "id": id,
                    "lastIndex": (page - 1),
                    "location": 0
                })
            })
            postJson(url, reqBody).then(json => {
                const { songlist, songs, totalSongsCnt } = json.cgi.data
                const { name: title, pic: cover, desc: about } = songlist.header
                Object.assign(result, {
                    cover,
                    title,
                    about,
                    total: totalSongsCnt
                })
                songs.forEach(item => {
                    const { song } = item
                    const artist = song.singer.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: song.album.id, name: song.album.title }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.album.mid)
                    const track = new Track(song.id, DouBan.CODE, song.name, artist, album, duration, cover)
                    track.mid = song.mid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = new Track(id, DouBan.CODE)
            const types = ['320', '128', 'm4a']
            for (var i = 0; i < types.length; i++) {
                const vkeyJson = await QQ.getVKeyJson(track, types[i])
                const { midurlinfo, sip } = vkeyJson.req_1.data
                const urlInfo = midurlinfo[0]
                const { vkey } = urlInfo

                if ((vkey || '').trim().length > 0) {
                    result.url = sip[0] + urlInfo.purl
                    break
                }
            }
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const url = "http://u.y.qq.com/cgi-bin/musicu.fcg"
            const reqBody = lyricExtReqBody(id, track)
            const result = { id, platform: QQ.CODE, lyric: null, trans: null }
            getJson(url, reqBody).then(json => {
                const { lyric, roma, trans } = json.req_1.data
                Object.assign(result, { lyric: Lyric.parseFromText(base64Decode(lyric)) })
                if (roma) { //TODO
                    Object.assign(result, { roma: Lyric.parseFromText(hexDecode(roma)) })
                }
                if (trans) {
                    Object.assign(result, { trans: Lyric.parseFromText(base64Decode(trans)) })
                }
                resolve(result)
            })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)、热门歌曲等
    static artistDetail(id) {
        return new Promise(async (resolve, reject) => {
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=ListSingerSong"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                cgi: moduleReq("fm.mooVisit.mooVisitServer", "ListSingerSong", {
                    "id": parseInt(id),
                    "idType": 2,
                    "sortType": 1,
                    "cursor": 0
                })
            })
            const result = { id, platform: DouBan.CODE, title: '未知歌手', cover: 'default_cover.png', data: [], about: '' }
            postJson(url, reqBody).then(json => {
                const { songList: songs } = json.cgi.data
                songs.forEach(item => {
                    const song = item
                    const artist = song.singer.map(ar => {
                        if (ar.id === id) {
                            if (result.title === '未知歌手') {
                                Object.assign(result, {
                                    title: ar.name || ar.title
                                })
                            }
                            if (result.cover === 'default_cover.png') {
                                Object.assign(result, {
                                    cover: getArtistCover(ar.mid)
                                })
                            }
                        }
                        return { id: ar.id, name: ar.name || ar.title }
                    })
                    const album = { id: song.album.id, name: song.album.title }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.album.mid)
                    const track = new Track(song.id, DouBan.CODE, song.name, artist, album, duration, cover)
                    track.mid = song.mid
                    track.pid = id
                    result.data.push(track)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌手详情：歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        if (page < 2) return DouBan.artistDetail(id)
        return new Promise((resolve, reject) => {
            const result = { id, offset, limit, page, total: 0, data: [] }
            resolve(result)
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise(async (resolve, reject) => {
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=ListSingerAlbum"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                cgi: moduleReq("fm.mooVisit.mooVisitServer", "ListSingerAlbum", {
                    "id": parseInt(id),
                    "idType": 2,
                    "sortType": 1,
                    "cursor": 0
                })
            })
            const result = { id, platform: DouBan.CODE, offset, limit, page, total: 1, data: [] }
            postJson(url, reqBody).then(json => {
                const { albumList: list } = json.cgi.data
                list.forEach(item => {
                    const { id: albumId, type: bizType, name: title, pic: cover, artists, publish_date: publishTime } = item
                    const artist = artists.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = new Album(albumId, DouBan.CODE, title, cover, artist, null, publishTime)
                    album.bizType = bizType
                    result.data.push(album)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌手详情: 简介
    static artistDetailAbout(id) {
        return new Promise((resolve, reject) => {
            resolve('')
        })
    }

    //电台：下一首歌曲
    static nextPlaylistRadioTrack(channel, track) {
        channel = channel.replace(DouBan.MHZ_CODE + '_', '')
        return new Promise(async (resolve, reject) => {
            let result = null
            const firstplay = !track ? 1 : 0
            //是否命中缓存
            if (channel == DouBan.RADIO_CACHE.channel) {
                const index = (firstplay == 1) ? 0 :
                    DouBan.RADIO_CACHE.data.findIndex(item => item.id == track.id)
                const length = DouBan.RADIO_CACHE.data.length
                if (length > 0 && index > -1 && index < (length - 1)) {
                    result = DouBan.RADIO_CACHE.data[index + 1]
                    resolve(result)
                    return
                }
            }
            //不命中，重置缓存
            DouBan.RADIO_CACHE.channel = channel
            DouBan.RADIO_CACHE.data.length = 0
            //拉取数据

            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=ListRadioSong"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": "1_098346_" + Date.now()
                },
                "fm.fmRadio.FmRadioSvr.ListRadioSong": moduleReq("fm.fmRadio.FmRadioSvr", "ListRadioSong", { "id": parseInt(channel) })
            })
            postJson(url, reqBody).then(json => {
                const { songList } = json['fm.fmRadio.FmRadioSvr.ListRadioSong'].data
                songList.forEach(song => {
                    const { songInfo, candidateInfo, midUrlInfo, extra_info } = song
                    const artist = songInfo.singer.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: songInfo.album.id, name: songInfo.album.title }
                    const duration = songInfo.interval * 1000
                    const cover = getAlbumCover(songInfo.album.mid)
                    const cacheTrack = new Track(songInfo.id, DouBan.CODE, songInfo.title, artist, album, duration, cover)
                    cacheTrack.mid = songInfo.mid
                    cacheTrack.channel = channel
                    cacheTrack.type = Playlist.NORMAL_RADIO_TYPE
                    DouBan.RADIO_CACHE.data.push(cacheTrack)
                })
                result = DouBan.RADIO_CACHE.data[0]
                resolve(result)
            }, error => resolve(null))
        })
    }

    //专辑详情
    static albumDetail(id) {
        id = parseInt(toTrimString(id).replace(DouBan.RECOMMAND_ALBUM_CODE + '_', ''))
        return new Promise(async (resolve, reject) => {
            const url = "https://u6.kuwo.cn/cgi-bin/musicu.fcg?cgiKey=QueryAlbumDetailEx"
            const reqBody = JSON.stringify({
                "comm": {
                    "OpenUDID": "ffffffffe3950e2e000000000033c587",
                    "udid": "ffffffffe3950e2e000000000033c587",
                    "ct": "111",
                    "cv": "7010001",
                    "v": "7010001",
                    "chid": "72280",
                    "os_ver": "7.1.2",
                    "aid": "6C96CFE0D9AB0000",
                    "phonetype": "SM-N950N",
                    "tmeAppID": "fm",
                    "nettype": "1010",
                    "wid": "3246708651311727616",
                    "rom": "samsung/samsung/dream2ltexx/dream2lte:7.1.2/NRD90M/700210421:user/release-keys/",
                    "uid": "98346",
                    "qimei": "b13acea18edc3ca714cbfce610001e817518",
                    "qimei36": "b13acea18edc3ca714cbfce610001e817518",
                    "fPersonality": "0",
                    "v4ip": await getIpv4(),
                    "gzip": "0",
                    "traceid": '1_098365_' + Date.now()
                },
                "cgi": moduleReq("fm.mooDetailPage.MooAlbumDetailSvr", "QueryAlbumDetailEx", {
                    "album_id": id,
                    "lastIndex": 0
                })
            })
            postJson(url, reqBody).then(json => {
                const { album, songs } = json.cgi.data
                const { id, name: title, pic: cover, desc: about, publish_date: publishTime, album_mid: mid, artists } = album
                const artist = artists.map(ar => ({ id: ar.id, name: ar.name }))
                const result = new Album(id, DouBan.CODE, title, cover, artist, null, publishTime, about)
                result.mid = mid

                songs.forEach(item => {
                    const { track: song } = item
                    const artist = song.singer.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: song.album.id, name: song.album.title }
                    const duration = song.interval * 1000
                    const cover = getAlbumCover(song.album.mid)
                    const track = new Track(song.id, DouBan.CODE, song.name, artist, album, duration, cover)
                    track.mid = song.mid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //专辑详情: 歌曲
    static albumDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(null), 1000)
        })
    }

    /* 暂时不再提供搜索实现
    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = keyword.trim()
            const url = "https://fm.douban.com/j/v2/query/song?q=" + keyword + "&limit=" + limit
            getJson(url).then(json => {
                const list = json.items
                const data = list.map(item => {
                    const artist = item.singers.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: item.aid, name: item.albumtitle }
                    const cover = item.cover || item.picture
                    const duration = item.length * 1000
                    const track = new Track(item.sid, DouBan.CODE, item.title, artist, album, duration, cover)
                    track.ssid = item.ssid
                    track.url = item.url
                    return track
                })
                const result = { platform: DouBan.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/query/songlist?q=" + keyword + "&limit=" + limit
            const result = { platform: DouBan.CODE, offset, limit, page, data: [] }
            getJson(url).then(json => {
                const list = json.items
                const data = list.map(item => {
                    const playlist = new Playlist(item.id, DouBan.CODE, item.cover, item.title)
                    return playlist
                })
                if (data && data.length > 0) result.data.push(...data)
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: DouBan.CODE, offset, limit, page, data: [] }
            resolve(result)
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/query/artist?q=" + keyword + "&limit=" + limit
            getJson(url).then(json => {
                const list = json.items
                const data = list.map(item => ({
                    id: item.id,
                    platform: DouBan.CODE,
                    title: item.name_usual,
                    cover: item.avatar,
                    channel: item.channel
                }))
                const result = { platform: DouBan.CODE, offset, limit, page, data }
                resolve(result)
            })
        })
    }
    */
}