import { United } from "./united";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { emitEvents } from "../common/EventBusWrapper";
import { 
    decodeLess, isLiveStream, stringEquals, 
    toTrimString, transformUrl 
} from "../common/Utils";
import { getJson, qsStringifyUrl } from "../common/HttpClient";
import { version } from '../../package.json';
import { Album } from "../common/Album";
import { Playlist } from "../common/Playlist";
import { Category } from "../common/Category";
import { useSettingStore } from "../renderer/store/settingStore";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

//TODO 插件化
export class Navidrome {
    static CODE = 'navidrome'
    static VERSION = '1.16.1'
    static DEFAULT_SESSION = { url: 'http://localhost:4533/' }
    static session = Navidrome.DEFAULT_SESSION

    static setSession(session) {
        Navidrome.session = session
        return new Promise((resolve, reject) => {
            Navidrome.getRestJson('ping').then(result => {
                const { status } = result || {}
                resolve(status == 'ok')
            })
        })
    }

    static getRestUrl(apiName) {
        const { url } = Navidrome.session || Navidrome.DEFAULT_SESSION
        const _url = transformUrl(url, 'http')
        return `${_url}rest/${apiName}`
    }

    static getAuthorization() {
        const { username, token, salt } = Navidrome.session
        const _token = decodeLess(token)
        return {
            u: username,
            t: _token,
            s: salt,
            v: Navidrome.VERSION,
            c: `Less Player@${version}`,
            f: 'json',
        }
    }

    static getAuthorizationReqBody(data) {
        const reqBody = { ...Navidrome.getAuthorization() }
        if(data && typeof data == 'object') Object.assign(reqBody, { ...data })
        return reqBody
    }

    static categories() {
        return new Promise((resolve, reject) => {
            resolve(null)
        })
    }

    static getRespJsonContent(json) {
        return json ? json['subsonic-response'] : {}
    }

    static getCover(id, size) {
        if(!id) return ''
        return qsStringifyUrl(
            Navidrome.getRestUrl('getCoverArt'), 
            { id, ...Navidrome.getAuthorization() }
        )
    }

    static getStreamUrl(id) {
        return qsStringifyUrl(
            Navidrome.getRestUrl('stream'), 
            { id, ...Navidrome.getAuthorization() }
        ) 
    }

    static getRestJson(apiName, data) {
        return new Promise((resolve, reject) => {
            const url = Navidrome.getRestUrl(apiName)
            const reqBody = Navidrome.getAuthorizationReqBody(data)
            getJson(url, reqBody).then(json => {
                const result = Navidrome.getRespJsonContent(json)
                const { status } = result
                status == 'ok' ? resolve(result) : reject(result)
            })
        })
    }

    static transformTrackTitle(title, path, suffix) {
        const index = title.indexOf('/')
        if(index < 0) return title
        return title.split('/').slice(1).join('')
    }

    static albumCategories() {
        return new Promise((resolve, reject) => {
            const result = new Category('专辑分类')
                .add('默认', 'alphabeticalByName')
                .add('随机', 'random')
                .add('收藏', 'starred')
                .add('高分', 'highest')
                .add('最新', 'newest')
                .add('最近', 'recent')
                .add('高频', 'frequent')
            resolve(result)
        })
    }

    //广场列表 - 专辑
    static albumSquare(cate, offset, limit, page, order) {
        cate = cate || 'alphabeticalByName'
        //Navidrome/Subsonic API并未提供相关分页信息
        //const total = stringEquals(cate, 'alphabeticalByName') ? 300 : 100
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Navidrome.CODE, data:[], offset, limit, page, order, total: 300 }
            
            const reqBody = {
                type: cate,
                size: limit || 10,
                offset: offset || 0,
            }
            Navidrome.getRestJson('getAlbumList2', reqBody).then(json => {
                const { album } = json.albumList2
                if(album && album.length > 0) {
                    album.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, year, comment: about } = item
                        result.data.push({
                            id, 
                            platform: Navidrome.CODE,
                            title, 
                            subtitle: artistName,
                            cover: Navidrome.getCover(coverArt),
                            artist: [{ id: artistId, name: artistName }],
                            publishTime: toTrimString(year),
                            about,
                        })
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //广场列表 - 歌单
    static playlistSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Navidrome.CODE, data:[], offset, limit, page, order }
    
            Navidrome.getRestJson('getPlaylists').then(json => {
                const { playlist } = json.playlists
                if(playlist && playlist.length > 0) {
                    playlist.forEach(item => {
                        const { id, name: title, coverArt, comment: about } = item
                        result.data.push({
                            id, 
                            platform: Navidrome.CODE,
                            title, 
                            cover: Navidrome.getCover(coverArt),
                            type: Playlist.NORMAL_TYPE,
                            about,
                        })
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //广场列表 - 歌手
    static artistSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Navidrome.CODE, data:[], offset, limit, page, order }
            
            Navidrome.getRestJson('getArtists').then(json => {
                const { index } = json.artists
                const categories = new Category('歌手分类')
                let currentIndex = 0
                index.forEach((item, index) => {
                    const { name } = item
                    categories.add(name, name)
                    if(cate == name) currentIndex = index
                })
                Object.assign(result, { categories })

                const { artist } = index[currentIndex]
                if(artist && artist.length > 0) {
                    artist.forEach(item => {
                        const { id, name: title, coverArt, } = item
                        result.data.push({
                            id, 
                            platform: Navidrome.CODE,
                            title, 
                            cover: Navidrome.getCover(coverArt),
                        })
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //广场列表 - 歌曲
    static songSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Navidrome.CODE, data:[], offset, limit, page, order, total: 1 }
            if(page > 1) return resolve(result)

            Navidrome.getRestJson('getRandomSongs', { size: (limit || 36) }).then(json => {
                const { song } = json.randomSongs
                if(song && song.length > 0) {
                    song.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, album: albumName, albumId, duration, path, suffix, } = item
                        const artist = [{ id: artistId, name: artistName }]
                        const album = { id: albumId, name: albumName }
                        const cover = Navidrome.getCover(coverArt)
                        const _title = Navidrome.transformTrackTitle(title, path, suffix)
                        const _duration = duration ? duration * 1000 : 0
                        const track = new Track(id, Navidrome.CODE, _title, artist, album, _duration, cover)
                        Object.assign(track, {
                            url: Navidrome.getStreamUrl(id), 
                            type: Playlist.NORMAL_TYPE,
                        })
                        result.data.push(track)
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //广场列表 - FM电台
    static radioSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Navidrome.CODE, data:[], offset, limit, page, order }
    
            Navidrome.getRestJson('getInternetRadioStations').then(json => {
                const { internetRadioStation } = json.internetRadioStations
                if(internetRadioStation && internetRadioStation.length > 0) {
                    internetRadioStation.forEach(item => {
                        const { id, name: title, streamUrl, coverArt } = item
                        const streamType = isLiveStream(streamUrl) ? 0 : 1
                        result.data.push({
                            id, 
                            platform: Navidrome.CODE,
                            title, 
                            cover: Navidrome.getCover(coverArt || 'al-1e6519da32a1eed2d492c5fac4dbf2c1_654f63a6'),
                            type: Playlist.FM_RADIO_TYPE,
                            data: [{
                                id,
                                title,
                                cover: Navidrome.getCover(coverArt || 'al-1e6519da32a1eed2d492c5fac4dbf2c1_654f63a6'),
                                artist: [{ id: '', name: 'Navidrome' }],
                                album: { id: '', name: '' },
                                url: streamUrl,
                                type: Playlist.FM_RADIO_TYPE,
                                streamType,
                            }]
                        })
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { id, platform: Navidrome.CODE, offset, limit, page, data:[] }
            if(page > 1) return resolve(result)
            Navidrome.getRestJson('getPlaylist', { id }).then(json => {
                const { name: title, coverArt, entry, comment: about } = json.playlist
                Object.assign(result, {
                    title,
                    cover: Navidrome.getCover(coverArt),
                    about,
                })
                if(entry && entry.length > 0) {
                    entry.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, album: albumName, albumId, duration, path, suffix, } = item
                        const artist = [{ id: artistId, name: artistName }]
                        const album = { id: albumId, name: albumName }
                        const cover = Navidrome.getCover(coverArt)
                        const _title = Navidrome.transformTrackTitle(title, path, suffix)
                        const _duration = duration ? duration * 1000 : 0
                        const track = new Track(id, Navidrome.CODE, _title, artist, album, _duration, cover)
                        Object.assign(track, {
                            url: Navidrome.getStreamUrl(id),
                            type: Playlist.NORMAL_TYPE,
                        })
                        result.data.push(track)
                    })
                }
                resolve(result)
            })
        })
    }

    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //URL
            if(!Track.hasUrl(result)) {
                Object.assign(track, { url: Navidrome.getStreamUrl(id) })
            }

            //封面
            const { isUseOnlineCoverEnable } = useSettingStore()
            if(!Track.hasCover(result) || isUseOnlineCoverEnable) {
                const onlineCandidate = await United.transferTrack(result, { isGetCover: true })
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    if (cover && result.cover != cover) {
                        Object.assign(result, { cover })
                        onTrackUpdated(result)
                    }
                }
            }
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //内嵌歌词
            let lyricText = result.embeddedLyricText
            //在线歌词
            let onlineCandidate = null
            if (!lyricText) {
                onlineCandidate = await United.transferTrack(result, { isGetLyric: true })
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(result, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(result, { lyric: Lyric.parseFromText(lyricText) })
            }
            
            //封面
            const { isUseOnlineCoverEnable } = useSettingStore()
            if(!Track.hasCover(result) || isUseOnlineCoverEnable) {
                if (!onlineCandidate || !Track.hasCover(onlineCandidate)) {
                    onlineCandidate = await United.transferTrack(result, { isGetCover: true })
                }
                if (onlineCandidate) {
                    const { cover } = onlineCandidate
                    if (cover && result.cover != cover) {
                        Object.assign(result, { cover })
                        onTrackUpdated(result)
                    }
                }
            }
            resolve(result)
        })
    }

    //歌手详情：Name、Cover、简介(如果有)、热门歌曲等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            //getArtistInfo
            Navidrome.getRestJson('getArtist', { id }).then(json => {
                const { artist, } = json
                const { id, name: title, album, coverArt, artistImageUrl } = artist
                const result = { 
                    id, 
                    platform: Navidrome.CODE, 
                    title, 
                    cover: Navidrome.getCover(coverArt),
                }
                resolve(result)
            })
        })
    }

    //歌手详情：热门歌曲
    static artistDetailHotSongs(id) {
        return new Promise((resolve, reject) => {
            Navidrome.getRestJson('getArtist', { id }).then(async json => {
                const { artist, } = json
                const { id, name: title, coverArt, } = artist
                const result = { 
                    id, 
                    platform: Navidrome.CODE, 
                    title, 
                    cover: Navidrome.getCover(coverArt),
                    data: []
                }
                const topSongsResult = await Navidrome.getRestJson('getTopSongs', { artist: title })
                const { topSongs } = topSongsResult
                const { song } = topSongs
                if(song && song.length > 0) {
                    song.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, album: albumName, albumId, duration, path, suffix, } = item
                        const artist = [{ id: artistId, name: artistName }]
                        const album = { id: albumId, name: albumName }
                        const cover = Navidrome.getCover(coverArt)
                        const _title = Navidrome.transformTrackTitle(title, path, suffix)
                        const _duration = duration ? duration * 1000 : 0
                        const track = new Track(id, Navidrome.CODE, _title, artist, album, _duration, cover)
                        Object.assign(track, {
                            url: Navidrome.getStreamUrl(id),
                            type: Playlist.NORMAL_TYPE,
                        })
                        result.data.push(track)
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            Navidrome.getRestJson('getArtist', { id }).then(json => {
                const result = { id, platform: Navidrome.CODE, offset, limit, page, data: [] }
                const { album, } = json.artist
                if(album && album.length > 0) {
                    album.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, year, comment: about } = item
                        result.data.push({
                            id, 
                            platform: Navidrome.CODE,
                            title, 
                            cover: Navidrome.getCover(coverArt),
                            artist: [{ id: artistId, name: artistName }],
                            publishTime: toTrimString(year),
                            about,
                        })
                    })
                }
                setTimeout(() => resolve(result), 202)
            })
        })
    }

    //歌手详情: 简介
    static artistDetailAbout(id) {
        return new Promise((resolve, reject) => {
            resolve('')
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            Navidrome.getRestJson('getAlbum', { id }).then(json => {
                const { album } = json
                const { id, name: title, artist: artistName, artistId, coverArt, year, song, } = album
                const cover = Navidrome.getCover(coverArt)
                const artist = [{ id: artistId, name: artistName }]
                const company = ''
                const publishTime = toTrimString(year)
                const about = ''
                const result = new Album(id, Navidrome.CODE, title, cover, artist, company, publishTime, about)
                if(song && song.length > 0) {
                    song.forEach(item => {
                        const { id, title, artist: artistName, artistId, coverArt, album: albumName, albumId, duration, path, suffix } = item
                        const artist = [{ id: artistId, name: artistName }]
                        const album = { id: albumId, name: albumName }
                        const cover = Navidrome.getCover(coverArt)
                        const _title = Navidrome.transformTrackTitle(title, path, suffix)
                        const _duration = duration ? duration * 1000 : 0
                        const track = new Track(id, Navidrome.CODE, _title, artist, album, _duration, cover)
                        track.url = Navidrome.getStreamUrl(id)
                        track.type = Playlist.NORMAL_TYPE
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        keyword = toTrimString(keyword)
        return new Promise((resolve, reject) => {
            
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        keyword = toTrimString(keyword)
        return new Promise((resolve, reject) => {
            
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        keyword = toTrimString(keyword)
        return new Promise((resolve, reject) => {
            
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        keyword = toTrimString(keyword)
        return new Promise((resolve, reject) => {
            
        })
    }

    //搜索: 视频
    static searchVideos(keyword, offset, limit, page) {
        keyword = toTrimString(keyword)
        return new Promise((resolve, reject) => {
            
        })
    }

}
