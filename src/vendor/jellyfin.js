import { United } from "./united";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { emitEvents } from "../common/EventBusWrapper";
import { base64Parse, decodeLess, isLiveStream, md5, stringEquals, stringEqualsIgnoreCase, toTrimString, transformUrl  } from "../common/Utils";
import { getJson, postJson, qsStringifyUrl } from "../common/HttpClient";
import { version } from '../../package.json';
import { Album } from "../common/Album";
import { Playlist } from "../common/Playlist";
import { Category } from "../common/Category";
import { useSettingStore } from "../renderer/store/settingStore";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

//TODO 插件化
export class Jellyfin {
    static CODE = 'jellyfin'
    static VERSION = '10.9.11'
    static DEFAULT_SESSION = { url: 'http://localhost:8096/' }
    static session = Jellyfin.DEFAULT_SESSION

    static setSession(session) {
        Jellyfin.session = session
        const client = 'Less Player'
        const device = 'Electron'
        const deviceId = md5(device)
        Object.assign(Jellyfin.session, { client, device, deviceId, version })
        return new Promise((resolve, reject) => {
            Jellyfin.authenticate().then(result => {
                const { token, userId } = result
                Object.assign(Jellyfin.session, { token, userId })
                resolve(true)
            })
        })
    }

    static getRestUrl(path) {
        const { url, userId } = Jellyfin.session || Jellyfin.DEFAULT_SESSION
        const _url = transformUrl(url, 'http')
        return `${_url}${path}`
    }

    static authenticate() {
        return new Promise((resolve, reject) => {
            const { username, password } = Jellyfin.session
            const data = { Username: username, Pw: decodeLess(password) }
            const config = {
                headers: { 'Content-Type': 'application/json', }
            }
            Jellyfin.postRestJson('Users/AuthenticateByName', data, config)
                .then(json => {
                    const { AccessToken: token, SessionInfo } = json
                    const { UserId: userId } = SessionInfo
                    resolve({ token, userId })
                })
        })
    }

    static getAuthorization() {
        const { client, device, deviceId, version, apiKey, token, } = Jellyfin.session
        //目前API Key暂时没用上
        const _token = (typeof token == 'string') ? toTrimString(token) : decodeLess(apiKey)
        return {
            'Authorization': `MediaBrowser Client="${client}", Device="${device}", DeviceId="${deviceId}", Version="${version}", Token="${_token}"` 
        }
    }

    static getUserId() {
        const { userId } = Jellyfin.session
        return userId
    }

    static categories() {
        return new Promise((resolve, reject) => {
            resolve(null)
        })
    }

    static getCover(Id, ServerId, PrimaryImageTag) {
        if(!Id || !PrimaryImageTag) return ''
        return qsStringifyUrl(
            Jellyfin.getRestUrl(`Items/${Id}/Images/Primary`), 
            { 
                fillHeight: 412,
                fillWidth: 412,
                quality: 96,
                tag: PrimaryImageTag
            }
        )
    }

    static getStreamUrl(Id, Container, mediaSourceId, Tag) {
        if(!mediaSourceId || !Tag) {
            return Jellyfin.getRestUrl(`Audio/${Id}/stream.${Container}`)
        }
        const { apiKey, deviceId } = Jellyfin.session
        return qsStringifyUrl(
            Jellyfin.getRestUrl(`Audio/${Id}/stream.${Container}`),
            { 
                Static: true,
                api_key: apiKey,
                deviceId,
                mediaSourceId,
                Tag,
            }
        )
    }

    static getRestJson(path, data, config) {
        return new Promise((resolve, reject) => {
            const url = Jellyfin.getRestUrl(path)
            const headers = Jellyfin.getAuthorization()
            config = config || {}
            const _headers = headers
            if(config.headers) Object.assign(_headers, { ...config.headers, ...headers })
            Object.assign(config, { headers: _headers })
            const _data = data ? { ...data, userId: Jellyfin.getUserId() } : data
            getJson(url, _data, config).then(json => resolve(json))
        })
    }

    static postRestJson(path, data, config, token) {
        return new Promise((resolve, reject) => {
            const url = Jellyfin.getRestUrl(path)
            const headers = Jellyfin.getAuthorization()
            config = config || {}
            const _headers = headers
            if(config.headers) Object.assign(_headers, { ...config.headers, ...headers })
            Object.assign(config, { headers: _headers })

            postJson(url, data, config).then(json => resolve(json))
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
            resolve(null)
        })
    }

    static userView(name) {
        return new Promise((resolve, reject) => {
            const reqBody = { presetViews: [name] }
            Jellyfin.getRestJson('UserViews', reqBody).then(json => {
                const { Items } = json
                if(Items && Items.length > 0) {
                    const viewItems = Items.filter(item => (stringEqualsIgnoreCase(item.Name, name))) || []
                    const result = viewItems[0]|| {}
                    resolve(result)
                }
            })
        })
    }

    static musicUserView() {
        return Jellyfin.userView('music')
    }

    static playlistsUserView() {
        return Jellyfin.userView('playlists')
    }

    static getAlphabetsIndex() {
        return '#ABCDEFGHIJKLMNOPQRSTUVWXYZ%'.split('')
    }

    static limitResult(result, limit) {
        if(!result || !result.data) return result
        if(result.data.length < 1) return result

        const { length } = result.data
        const deleteCount = length - limit
        if(deleteCount > 0) result.data.splice(limit, deleteCount)
        return result
    }

    //广场列表 - 专辑
    static albumSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order, total: 300 }
            //当前通过parentId参数查询
            //另一种实现方式，通过递归方式查询：设置recursive、includeItemTypes参数
            Jellyfin.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    startIndex: offset,
                    limit,
                }
                
                Jellyfin.getRestJson('Items', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, ImageTags } = item
                            const { Primary } = ImageTags
                            result.data.push({
                                id: Id, 
                                platform: Jellyfin.CODE,
                                title: Name, 
                                subtitle: AlbumArtist,
                                cover: Jellyfin.getCover(Id, ServerId, Primary),
                                artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                                publishTime: toTrimString(ProductionYear),
                                ServerId,
                            })
                        })
                    }
                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay)
                })
            })
        })
    }

    //广场列表 - 歌单
    static playlistSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order }
    
            Jellyfin.playlistsUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    startIndex: offset,
                    limit,
                }
                Jellyfin.getRestJson('Items', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ImageTags } = item
                            const { Primary } = ImageTags
                            result.data.push({
                                id: Id, 
                                platform: Jellyfin.CODE,
                                title: Name, 
                                cover: Jellyfin.getCover(Id, ServerId, Primary),
                                type: Playlist.NORMAL_TYPE,
                                ServerId,
                            })
                        })
                    }
                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay)
                })
            })
        })
    }

    //广场列表 - 歌手
    static artistSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order }
            
            const _cate = toTrimString(cate)
            Jellyfin.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    nameStartsWith: _cate.replace('#', '')
                }
                if(_cate === '%') {
                    Object.assign(reqBody, { nameLessThan: 'A' })
                }

                const categories = new Category('歌手分类')
                Jellyfin.getAlphabetsIndex().forEach((item, index) => {
                    categories.add(item, item)
                })
                Object.assign(result, { categories })

                Jellyfin.getRestJson('Artists', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ImageTags } = item
                            const { Primary } = ImageTags
                            result.data.push({
                                id: Id, 
                                platform: Jellyfin.CODE,
                                title: Name, 
                                cover: Jellyfin.getCover(Id, ServerId, Primary),
                                ServerId,
                            })
                        })
                    }
                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay) 
                })
            })
        })
    }

    //广场列表 - 歌曲
    static songSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order, total: 10 }
            
            const reqBody = {
                recursive: true,
                startIndex: offset,
                limit,
                mediaTypes: ['Audio'],
                fields: ['MediaSources']
            }
            Jellyfin.getRestJson('Items', reqBody).then(json => {
                const { Items, TotalRecordCount } = json
                Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, ImageTags, Container, MediaSources } = item
                        const { Primary } = ImageTags
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Jellyfin.getCover(Id, ServerId, Primary)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: Album }
                        //const album = { id: '', name: '' }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Jellyfin.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Jellyfin.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
                        })
                        result.data.push(track)
                    })
                }
                const delay = (result.data > 10) ? 0 : 366
                setTimeout(() => resolve(result), delay)
            })
        })
    }

    //广场列表 - FM电台
    static radioSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order }
    
            Jellyfin.getRestJson('getInternetRadioStations').then(json => {
                const { internetRadioStation } = json.internetRadioStations
                if(internetRadioStation && internetRadioStation.length > 0) {
                    internetRadioStation.forEach(item => {
                        const { id, name: title, streamUrl, coverArt } = item
                        const streamType = isLiveStream(streamUrl) ? 0 : 1
                        result.data.push({
                            id, 
                            platform: Jellyfin.CODE,
                            title, 
                            cover: Jellyfin.getCover(coverArt || 'al-1e6519da32a1eed2d492c5fac4dbf2c1_654f63a6'),
                            type: Playlist.FM_RADIO_TYPE,
                            data: [{
                                id,
                                title,
                                cover: Jellyfin.getCover(coverArt || 'al-1e6519da32a1eed2d492c5fac4dbf2c1_654f63a6'),
                                artist: [{ id: '', name: 'Jellyfin' }],
                                album: { id: '', name: '' },
                                url: streamUrl,
                                type: Playlist.FM_RADIO_TYPE,
                                streamType,
                            }]
                        })
                    })
                }
                const delay = (result.data > 10) ? 0 : 366
                setTimeout(() => resolve(result), delay)
            })
        })
    }

    //广场列表 - 流派
    static genresSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Jellyfin.CODE, data:[], offset, limit, page, order, total: 10 }
            Jellyfin.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = {
                    parentId: Id,
                    recursive: true,
                }
                Jellyfin.getRestJson('MusicGenres', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ImageTags, } = item
                            const { Primary } = ImageTags
                            const cover = Jellyfin.getCover(Id, ServerId, Primary)
                            result.data.push({
                                id: Id,
                                platform: Jellyfin.CODE,
                                title: Name,
                                cover,
                                type: Playlist.GENRE_TYPE,
                            })
                        })
                    }
                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay)
                })
            })
        })
    }

    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            Jellyfin.getRestJson(`Items/${id}`).then(async json => {
                const { Id, Name, ServerId, ImageTags } = json
                const { Primary } = ImageTags
                const cover = Jellyfin.getCover(Id, ServerId, Primary)
                const result = { id, platform: Jellyfin.CODE, title: Name, cover, offset, limit, page, data:[] }
                
                const reqBody = {
                    parentId: id,
                    recursive: true,
                    fields: ['MediaSources']
                }
                const { Items: trackItems } = await Jellyfin.getRestJson('Items', reqBody) || { Items: [] }
                if(trackItems && trackItems.length > 0) {
                    trackItems.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, ImageTags, Container, MediaSources } = item
                        const { Primary } = ImageTags
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Jellyfin.getCover(Id, ServerId, Primary)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: Album }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Jellyfin.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Jellyfin.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
                        })
                        result.data.push(track)
                    })
                }
                resolve(result)
            })
        })
    }

    static playDetail(Id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //URL
            if(!Track.hasUrl(result)) {
                const { Container, mediaSourceId, Tag } = result
                Object.assign(result, { url: Jellyfin.getStreamUrl(Id, Container, mediaSourceId, Tag) })
            }
            
            //封面，顺便更新一下
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
            
            //封面，顺便更新一下
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
            Jellyfin.getRestJson('Items', { ids: [id] }).then(json => {
                const { Items } = json
                if(Items && Items.length > 0) {
                    const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, ImageTags } = Items[0]
                    const { Primary } = ImageTags
                    const result = {
                        id: Id, 
                        platform: Jellyfin.CODE,
                        title: Name, 
                        cover: Jellyfin.getCover(Id, ServerId, Primary),
                        ServerId,
                    }
                    resolve(result)
                }
            })
        })
    }

    //歌手详情: 专辑
    static artistDetailAlbums(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const reqBody = {
                recursive: true,
                includeItemTypes: ['MusicAlbum'],
                albumArtistIds: [id]
            }
            Jellyfin.getRestJson('Items', reqBody).then(json => {
                const result = { id, platform: Jellyfin.CODE, offset, limit, page, data: [] }
                const { Items } = json
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, ImageTags } = item
                        const { Primary } = ImageTags
                        result.data.push({
                            id: Id, 
                            platform: Jellyfin.CODE,
                            title: Name, 
                            //subtitle: AlbumArtist,
                            cover: Jellyfin.getCover(Id, ServerId, Primary),
                            artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                            publishTime: toTrimString(ProductionYear),
                            ServerId,
                        })
                    })
                }
                resolve(result)
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
    static albumDetail(Id) {
        return new Promise((resolve, reject) => {
            Jellyfin.getRestJson(`Items/${Id}`).then(async json => {
                const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, ImageTags } = json
                const { Primary } = ImageTags
                const cover = Jellyfin.getCover(Id, ServerId, Primary)
                const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                const publishTime = toTrimString(ProductionYear)
                const result = new Album(Id, Jellyfin.CODE, Name, cover, artist, '', publishTime)
                Object.assign(result,  { ServerId })
                const albumName = Name

                const reqBody = {
                    parentId: Id,
                    recursive: true,
                    fields: ['MediaSources']
                }
                const { Items: trackItems } = await Jellyfin.getRestJson('Items', reqBody) || { Items: [] }
                if(trackItems && trackItems.length > 0) {
                    trackItems.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, RunTimeTicks, ImageTags, Container, MediaSources } = item
                        const { Primary } = ImageTags
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Jellyfin.getCover(Id, ServerId, Primary)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: albumName }
                        //const album = { id: '', name: '' }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Jellyfin.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Jellyfin.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
                        })
                        result.data.push(track)
                    })
                }

                const delay = (result.data > 10) ? 0 : 366
                setTimeout(() => resolve(result), delay)
            })
        })
    }

    static genreDetailAlbums(Id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Jellyfin.CODE, data:[], offset, limit, page, }
            Jellyfin.musicUserView().then(userView => {
                const { Id: Pid } = userView
                const reqBody = {
                    parentId: Pid,
                    recursive: true,
                    includeItemTypes: ['MusicAlbum'],
                    genreIds: [Id]
                }
                Jellyfin.getRestJson('Items', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })

                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, ImageTags } = item
                            const { Primary } = ImageTags
                            result.data.push({
                                id: Id, 
                                platform: Jellyfin.CODE,
                                title: Name, 
                                subtitle: AlbumArtist,
                                cover: Jellyfin.getCover(Id, ServerId, Primary),
                                artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                                publishTime: toTrimString(ProductionYear),
                                ServerId,
                            })
                        })
                    }

                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay)
                })
            })
        })
    }

    static genreDetailArtists(Id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Jellyfin.CODE, data:[], offset, limit, page, }
            Jellyfin.musicUserView().then(userView => {
                const { Id: Pid } = userView
                const reqBody = {
                    parentId: Pid,
                    recursive: true,
                    genreIds: [Id],
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                }
                Jellyfin.getRestJson('Artists', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ImageTags } = item
                            const { Primary } = ImageTags
                            result.data.push({
                                id: Id, 
                                platform: Jellyfin.CODE,
                                title: Name, 
                                cover: Jellyfin.getCover(Id, ServerId, Primary),
                                ServerId,
                            })
                        })
                    }
                    const delay = (result.data > 10) ? 0 : 366
                    setTimeout(() => resolve(result), delay) 
                })
            })
        })
    }

    static genreDetailAllSongs_v0(Id) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Jellyfin.CODE, data:[] }
            Jellyfin.genreDetail(Id).then(detail => {
                const albums = detail.data || []
                if(albums.length < 1) return resolve(result)
                
                const songsPromises = albums.map(album => {
                    return Jellyfin.albumDetail(album.id)
                })
                Promise.all(songsPromises).then(albumDetails => {
                    albumDetails.forEach(detail => {
                        const { data } = detail
                        if(!data || data.length < 1) return 
                        result.data.push(...data)
                    })
                    resolve(Jellyfin.limitResult(result, 1024))
                })
            })
        })  
    }

    static genreDetailAllSongs(Id) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Jellyfin.CODE, data:[] }
            const reqBody = {
                recursive: true,
                mediaTypes: ['Audio'],
                genreIds: [Id],
                fields: ['MediaSources']
            }
            Jellyfin.getRestJson('Items', reqBody).then(json => {
                const { Items } = json
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId,Album, RunTimeTicks, ImageTags, Container, MediaSources } = item
                        const { Primary } = ImageTags
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Jellyfin.getCover(Id, ServerId, Primary)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: Album }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Jellyfin.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Jellyfin.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
                        })
                        result.data.push(track)
                    })
                    resolve(Jellyfin.limitResult(result, 1024))
                }
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
