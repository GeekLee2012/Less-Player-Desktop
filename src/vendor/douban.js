import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";



const CATEGORY_GROUP = {
    scenario: "心情场景",
    language: "语言年代",
    artist: "艺术家",
    genre: "风格流派"
}

export class DouBan {
    static CODE = 'douban'
    static MHZ_PREFIX = 'MHz_'

    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const result = { platform: DouBan.CODE, data: [], orders: [] }
            const defaultCategory = new Category("默认")
            defaultCategory.add("兆赫MHz", "MHz")
            //defaultCategory.add("为你推荐", '1')
            const songlistCategory = new Category('歌单')
            result.data.push(defaultCategory)
            result.data.push(songlistCategory)

            const url = "https://fm.douban.com/j/v2/songlist/explore/genres"
            getJson(url).then(json => {
                json.forEach(item => {
                    songlistCategory.add(item.name, item.id + '')
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page, order) {
        const originCate = cate
        let resolvedCate = (cate || '').toString().trim()
        resolvedCate = resolvedCate.length > 0 ? resolvedCate : 'MHz'
        if (resolvedCate == 'MHz') return DouBan.mhzChannels(cate, offset, limit, page)
        return new Promise((resolve, reject) => {
            const result = { platform: DouBan.CODE, cate: originCate, offset, limit, page, total: 1, data: [] }
            if (page > 1) { //TODO
                resolve(result)
                return
            }
            const url = "https://fm.douban.com/j/v2/songlist/explore?type=hot&genre=" + resolvedCate + "&start=" + offset + "&limit=" + limit + "&sample_cnt=5"
            getJson(url).then(json => {
                json.forEach(item => {
                    const cover = item.covers.large
                    const playlist = new Playlist(item.id, DouBan.CODE, cover, item.title)
                    //if(JSON.stringify(result.data).indexOf(JSON.stringify(playlist)) !=-1) return
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
        if (page > 1) return DouBan.guessMhzChannels(cate, offset, limit, page)
        return new Promise((resolve, reject) => {
            const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 10, data: [] }
            const url = "https://fm.douban.com/j/v2/rec_channels?specific=all"
            getJson(url).then(json => {
                const channels = json.data.channels

                //豆瓣精选兆赫
                const recmmCover = "https://img2.doubanio.com/img/site/large/23424ce960155c2"
                const recmmChannel = new Playlist(DouBan.MHZ_PREFIX + '-10', DouBan.CODE, recmmCover, '豆瓣精选')
                recmmChannel.isRadioType = true
                result.data.push(recmmChannel)
                //其他兆赫
                Object.keys(channels).forEach(key => {
                    const cateName = CATEGORY_GROUP[key]
                    if (!cateName) return
                    const chnnItems = channels[key].map(item => {
                        const cover = item.cover || item.banner
                        const title = cateName + '| ' + item.name
                        const playlist = new Playlist(DouBan.MHZ_PREFIX + item.id, DouBan.CODE, cover, title)
                        playlist.isRadioType = true
                        return playlist
                    })
                    result.data.push(...chnnItems)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //猜你喜欢兆赫
    static guessMhzChannels(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { platform: DouBan.CODE, cate, offset, limit, page, total: 0, data: [] }
            const url = "https://fm.douban.com/j/v2/artist/guess?limit=10&is_new_user=true"
            getJson(url).then(json => {
                const channels = json.artists

                //其他兆赫
                channels.forEach(item => {
                    const cover = item.avatar
                    const title = '艺术家| ' + item.name_usual + ' 系'
                    const playlist = new Playlist(DouBan.MHZ_PREFIX + item.channel, DouBan.CODE, cover, title)
                    playlist.isRadioType = true
                    result.data.push(playlist)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/songlist/" + id + "?kbps=192"
            const result = new Playlist(id, DouBan.CODE)
            getJson(url).then(json => {
                //const result = new Playlist(id, DouBan.CODE, json.cover, json.title, url, json.intro)
                //result.total = json.count
                Object.assign(result, {
                    cover: json.cover,
                    title: json.title,
                    about: json.intro,
                    total: json.count,
                    url
                })
                const list = json.songs
                list.forEach(item => {
                    const artist = item.singers.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: item.aid, name: item.albumtitle }
                    const duration = item.length * 1000
                    const cover = item.picture.trim()
                    const track = new Track(item.sid, DouBan.CODE, item.title, artist, album, duration, cover)
                    track.url = item.url
                    track.ssid = item.ssid
                    track.pid = id
                    result.addTrack(track)
                })
                resolve(result)
            }).catch(error => resolve(result))
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/lyric" + "?sid=" + id + "&ssid=" + track.ssid
            getJson(url).then(json => {
                const lyricText = json.lyric
                track.lyric = Lyric.parseFromText(lyricText)
                resolve(track)
            }).catch(error => resolve(track))
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/lyric"
            const reqBody = {
                sid: id,
                ssid: track.ssid
            }
            getJson(url, reqBody).then(json => {
                const result = { id, platform: DouBan.CODE, lyric: null, trans: null }
                Object.assign(result, { lyric: Lyric.parseFromText(json.lyric) })
                resolve(result)
            })
        })
    }

    //歌手详情：Name、Cover、简介(如果有)、热门歌曲等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/artist/" + id + "/"
            getJson(url).then(json => {
                const cover = json.avatar
                const about = ''
                const result = { id, title: json.name, cover, data: [], about }
                const list = json.songlist.songs
                list.forEach(item => {
                    const artist = item.singers.map(ar => ({ id: ar.id, name: ar.name }))
                    const album = { id: item.aid, name: item.albumtitle }
                    const duration = item.length * 1000
                    const cover = item.picture.trim()
                    const track = new Track(item.sid, DouBan.CODE, item.title, artist, album, duration, cover)
                    track.url = item.url
                    track.ssid = item.ssid
                    result.data.push(track)
                })
                resolve(result)
            }).catch(error => resolve(null))
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

    //歌手详情: 简介
    static artistDetailAbout(id) {
        return new Promise((resolve, reject) => {
            resolve('')
        })
    }

    //电台：下一首歌曲
    static nextPlaylistRadioTrack(channel, track) {
        channel = channel.replace(DouBan.MHZ_PREFIX, '')
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/playlist"
            const reqBody = {
                channel,
                kbps: 192,
                client: "s:mainsite|y:3.0",
                app_name: "radio_website",
                version: 100,
                type: "n"
            }
            if (track && track.id) {
                Object.assign(reqBody, {
                    type: "s",
                    sid: track.id,
                    pt: "",
                    pb: 128,
                    apikey: ""
                })
            }
            getJson(url, reqBody).then(json => {
                if (json.song.length < 1) return
                const song = json.song[0]
                const artist = song.singers.map(ar => ({ id: ar.id, name: ar.name }))
                const album = { id: '', name: song.albumtitle }
                const duration = song.length * 1000
                const cover = song.picture
                const result = new Track(song.sid, DouBan.CODE, song.title, artist, album, duration, cover)
                result.channel = channel
                result.ssid = song.ssid
                result.url = song.url
                result.isRadioType = true
                resolve(result)
            }, error => resolve(null))
        })
    }

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
            getJson(url).then(json => {
                const list = json.items
                const data = list.map(item => {
                    const playlist = new Playlist(item.id, DouBan.CODE, item.cover, item.title)
                    return playlist
                })
                const result = { platform: DouBan.CODE, offset, limit, page, data }
                resolve(result)
            })
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

}