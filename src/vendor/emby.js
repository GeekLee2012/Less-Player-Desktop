import { United } from "./united";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { emitEvents } from "../common/EventBusWrapper";
import { base64Parse, decodeLess, isLiveStream, md5, stringEquals, stringEqualsIgnoreCase, toTrimString, toUpperCaseTrimString, transformUrl  } from "../common/Utils";
import { getJson, postJson, qsStringifyUrl } from "../common/HttpClient";
import { version } from '../../package.json';
import { Album } from "../common/Album";
import { Playlist } from "../common/Playlist";
import { Category } from "../common/Category";
import { useSettingStore } from "../renderer/store/settingStore";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

//TODO 插件化
export class Emby {
    static CODE = 'emby'
    static VERSION = '4.8.10.0'
    static DEFAULT_SESSION = { url: 'http://localhost:8096/' }
    static session = Emby.DEFAULT_SESSION

    static setSession(session) {
        Emby.session = session
        const client = 'Less Player'
        const device = 'Electron'
        const deviceId = md5(device)
        Object.assign(Emby.session, { client, device, deviceId, version })
        return new Promise((resolve, reject) => {
            Emby.authenticate().then(result => {
                const { token, userId } = result
                Object.assign(Emby.session, { token, userId })
                resolve(true)
            })
        })
    }

    static getRestUrl(path, keep) {
        const { url, userId } = Emby.session || Emby.DEFAULT_SESSION
        const _url = transformUrl(url, 'http')

        const isUserPath = (path.startsWith('Items') || path.startsWith('Views'))
        if(isUserPath && !keep) {
            return `${_url}emby/Users/${userId}/${path}`
        }
        return `${_url}emby/${path}`
    }

    static authenticate() {
        return new Promise((resolve, reject) => {
            const { username, password } = Emby.session
            const data = { Username: username, Pw: decodeLess(password) }
            Emby.postRestJson('Users/AuthenticateByName', data)
                .then(json => {
                    const { AccessToken: token, SessionInfo } = json
                    const { UserId: userId } = SessionInfo
                    resolve({ token, userId })
                })
        })
    }

    static getAuthorization_v0() {
        const { client, device, deviceId, version, apiKey, token, } = Emby.session
        //目前API Key暂时没用上
        const _token = (typeof token == 'string') ? toTrimString(token) : decodeLess(apiKey)
        return {
            'Authorization': `MediaBrowser Client="${client}", Device="${device}", DeviceId="${deviceId}", Version="${version}", Token="${_token}"` 
        }
        
    }

    static getAuthorization() {
        const { client, device, deviceId, version, apiKey, token, } = Emby.session
        //目前API Key暂时没用上
        const _token = (typeof token == 'string') ? toTrimString(token) : decodeLess(apiKey)
        return {
            'X-Emby-Client': client,
	        'X-Emby-Device-Name': device,
	        'X-Emby-Device-Id': deviceId,
            'X-Emby-Client-Version': version,
            'X-Emby-Token': _token,
            //'X-Emby-Language': 'zh-cn'
            //'X-Emby-Language': 'en-us'
        }
        
    }

    static getUserId() {
        const { userId } = Emby.session
        return userId
    }

    static categories() {
        return new Promise((resolve, reject) => {
            resolve(null)
        })
    }

    static getCover(item) {
        const { Id, ServerId, ImageTags, PrimaryImageItemId, PrimaryImageTag } = item || { }
        let _id = '', _tag = ''
        if(Id && ImageTags && ImageTags.Primary) {
            _id = Id
            _tag = ImageTags.Primary
        } else if(PrimaryImageItemId && PrimaryImageTag) {
            _id = PrimaryImageItemId
            _tag = PrimaryImageTag
        }
        if(!_id || !_tag) return ''

        return qsStringifyUrl(
            Emby.getRestUrl(`Items/${_id}/Images/Primary`, true), 
            { 
                maxHeight: 400, //412 
                maxWidth: 400,
                quality: 90,  //90
                tag: _tag
            }
        )
    }

    static getStreamUrl(Id, Container, mediaSourceId, Tag) {
        const { apiKey, deviceId } = Emby.session
        return qsStringifyUrl(
            Emby.getRestUrl(`Audio/${Id}/stream.${Container}`),
            { 
                static: true,
                api_key: apiKey,
                deviceId,
                mediaSourceId,
                Tag,
                ...Emby.getAuthorization()
            }
        )
    }

    static getRestJson(path, data, config) {
        return new Promise((resolve, reject) => {
            const url = Emby.getRestUrl(path)
            const authData = Emby.getAuthorization()
            const _data = data || {}
            Object.assign(_data, { ...authData })
            getJson(url, _data, config).then(json => resolve(json))
        })
    }

    static postRestJson(path, data, config, token) {
        return new Promise((resolve, reject) => {
            const url = Emby.getRestUrl(path)
            const authHeaders = Emby.getAuthorization()
            config = config || {}
            const { headers: cHeaders } = config
            const headers = authHeaders
            if(cHeaders) Object.assign(headers, { ...cHeaders, ...authHeaders })
            Object.assign(config, { headers })

            postJson(url, data, config).then(json => resolve(json))
        })
    }

    static transformTrackTitle(title, path, suffix) {
        const index = title.indexOf('/')
        if(index < 0) return title
        return title.split('/').slice(1).join('')
    }

    static toPlaylistType(item) {
        const { Type } = item || {}
        if(stringEqualsIgnoreCase(Type, 'MusicAlbum')) {
            return Playlist.ALBUM_TYPE
        } else if(stringEqualsIgnoreCase(Type, 'AUDIO')) {
            return Playlist.SONG_TYPE
        }
        return Playlist.NORMAL_TYPE
    }

    static albumCategories() {
        return new Promise((resolve, reject) => {
            const result = new Category('专辑分类')
            Emby.getAlphabetsIndex().forEach((item, index) => {
                result.add(item, item)
            })
            resolve(result)
        })
    }

    static userView(name) {
        return new Promise((resolve, reject) => {
            const reqBody = { presetViews: [name] }
            Emby.getRestJson('Views', reqBody).then(json => {
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
        return Emby.userView('music')
    }

    static playlistsUserView() {
        return Emby.userView('playlists')
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

    //广场列表 - 推荐
    static suggestionSquare(cate, offset, limit, page, order) {
        const _cate = toTrimString(cate) || 'latest'
        //最近播放
        if(stringEqualsIgnoreCase(_cate, 'recent')) {
            return Emby.suggestionsRecentlyPlayed(cate, offset, limit, page, order)
        }
        //最多播放
        if(stringEqualsIgnoreCase(_cate, 'frequent')) {
            return Emby.suggestionsFrequentlyPlayed(cate, offset, limit, page, order)
        }
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
            
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    limit,
                    SortBy: 'SortName',
                    SortOrder: 'Ascending'
                }
                const categories = new Category('推荐分类')
                const suggestionsIndex = [{
                    key: '最新音乐',
                    value: 'latest'
                }, {
                    key: '最近播放',
                    value: 'recent'
                }, {
                    key: '最多播放',
                    value: 'frequent'
                }]
                suggestionsIndex.forEach((item, index) => {
                    const { key, value } = item
                    categories.add(key, value)
                })
                Object.assign(result, { categories })

                Emby.getRestJson('Items/Latest', reqBody).then(json => {
                    const Items = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, AlbumArtist, ArtistItems, RunTimeTicks } = item
                            const type = Emby.toPlaylistType(item)
                            //限定类型为：专辑、歌曲
                            if(type != Playlist.ALBUM_TYPE && type != Playlist.SONG_TYPE) return 

                            const duration = Math.floor(RunTimeTicks / 10000)
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                subtitle: AlbumArtist,
                                cover: Emby.getCover(item),
                                artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                                duration,
                                ServerId,
                                type,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 推荐 - 最近播放
    static suggestionsRecentlyPlayed(cate, offset, limit, page, order) {
        const _cate = toTrimString(cate) || 'recent'
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
        
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    limit,
                    IncludeItemTypes: ['Audio'],
                    Recursive: true,
                    Fields: ['MediaSources', 'MediaStreams'],
                    Filters: ['IsPlayed'],
                    SortBy: 'DatePlayed',
                    SortOrder: 'Descending',
                }
                const categories = new Category('推荐分类')
                const suggestionsIndex = [{
                    key: '最新音乐',
                    value: 'latest'
                }, {
                    key: '最近播放',
                    value: 'recent'
                }, {
                    key: '最多播放',
                    value: 'frequent'
                }]
                suggestionsIndex.forEach((item, index) => {
                    const { key, value } = item
                    categories.add(key, value)
                })
                Object.assign(result, { categories })

                Emby.getRestJson('Items', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, Container, MediaSources } = item
                            const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                            const cover = Emby.getCover(item)
                            const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                            const album = { id: AlbumId, name: Album }
                            //const album = { id: '', name: '' }
                            const duration = Math.floor(RunTimeTicks / 10000)
                            const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                            Object.assign(track, {
                                url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
                                type: Playlist.NORMAL_TYPE,
                                Container,
                                mediaSourceId,
                                Tag: ETag,
                            })
                            result.data.push(track)
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 推荐 - 最多播放
    static suggestionsFrequentlyPlayed(cate, offset, limit, page, order) {
        const _cate = toTrimString(cate) || 'frequent'
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
        
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    limit,
                    IncludeItemTypes: ['Audio'],
                    Recursive: true,
                    Fields: ['MediaSources', 'MediaStreams'],
                    Filters: ['IsPlayed'],
                    SortBy: 'PlayCount',
                    SortOrder: 'Descending',
                }
                const categories = new Category('推荐分类')
                const suggestionsIndex = [{
                    key: '最新音乐',
                    value: 'latest'
                }, {
                    key: '最近播放',
                    value: 'recent'
                }, {
                    key: '最多播放',
                    value: 'frequent'
                }]
                suggestionsIndex.forEach((item, index) => {
                    const { key, value } = item
                    categories.add(key, value)
                })
                Object.assign(result, { categories })

                Emby.getRestJson('Items', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, Container, MediaSources } = item
                            const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                            const cover = Emby.getCover(item)
                            const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                            const album = { id: AlbumId, name: Album }
                            //const album = { id: '', name: '' }
                            const duration = Math.floor(RunTimeTicks / 10000)
                            const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                            Object.assign(track, {
                                url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
                                type: Playlist.NORMAL_TYPE,
                                Container,
                                mediaSourceId,
                                Tag: ETag,
                            })
                            result.data.push(track)
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 专辑
    static albumSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order, total: 300 }
            
            const _cate = toTrimString(cate)
            const reqBody = { 
                recursive: true,
                startIndex: offset,
                limit,
                includeItemTypes: ['MusicAlbum'],
                nameStartsWith: _cate.replace('#', ''),
                    SortBy: 'SortName',
                    SortOrder: 'Ascending'
            }
            if(_cate === '%') {
                Object.assign(reqBody, { nameLessThan: 'A' })
            }
            
            Emby.getRestJson('Items', reqBody).then(json => {
                const { Items, TotalRecordCount } = json
                Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, } = item

                        result.data.push({
                            id: Id, 
                            platform: Emby.CODE,
                            title: Name, 
                            subtitle: AlbumArtist,
                            cover: Emby.getCover(item),
                            artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                            publishTime: toTrimString(ProductionYear),
                            ServerId,
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
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
    
            Emby.playlistsUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    startIndex: offset,
                    limit,
                }
                Emby.getRestJson('Items', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, } = item
                            
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                cover: Emby.getCover(item),
                                type: Playlist.NORMAL_TYPE,
                                ServerId,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 歌手
    static artistSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
            
            const _cate = toTrimString(cate)
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    nameStartsWith: _cate.replace('#', ''),
                    SortBy: 'SortName',
                    SortOrder: 'Ascending'
                }
                if(_cate === '%') {
                    Object.assign(reqBody, { nameLessThan: 'A' })
                }

                const categories = new Category('歌手分类')
                Emby.getAlphabetsIndex().forEach((item, index) => {
                    categories.add(item, item)
                })
                Object.assign(result, { categories })

                Emby.getRestJson('Artists', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, } = item
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                cover: Emby.getCover(item),
                                ServerId,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 歌曲
    static songSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order, total: 10 }
            
            const reqBody = {
                recursive: true,
                startIndex: offset,
                limit,
                mediaTypes: ['Audio'],
                fields: ['MediaSources']
            }
            Emby.getRestJson('Items', reqBody).then(json => {
                const { Items, TotalRecordCount } = json
                Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, Container, MediaSources } = item
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Emby.getCover(item)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: Album }
                        //const album = { id: '', name: '' }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
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
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
            setTimeout(() => resolve(result), 202)
        })
    }

    //广场列表 - 流派
    static genresSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order, total: 10 }
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = {
                    parentId: Id,
                    recursive: true,
                    startIndex: offset,
                    limit,
                    IncludeItemTypes: ['MusicAlbum'],
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                }
                Emby.getRestJson('Genres', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, } = item
                            result.data.push({
                                id: Id,
                                platform: Emby.CODE,
                                title: Name,
                                cover: Emby.getCover(item),
                                type: Playlist.GENRE_TYPE,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    //广场列表 - 目录
    static folderSquare(cate, offset, limit, page, order) {
        return new Promise((resolve, reject) => {
            const result = { cate, platform: Emby.CODE, data:[], offset, limit, page, order }
    
            Emby.musicUserView().then(userView => {
                const { Id } = userView
                const reqBody = { 
                    parentId: Id,
                    startIndex: offset,
                    limit,
                    SortBy: ['IsFolder','Filename']
                }
                Emby.getRestJson('Items', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, } = item
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                cover: Emby.getCover(item),
                                type: Playlist.FOLDER_TYPE,
                                ServerId,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            Emby.getRestJson(`Items/${id}`).then(async json => {
                const { Id, Name, ServerId, } = json
                
                const cover = Emby.getCover(json)
                const result = { id, platform: Emby.CODE, title: Name, cover, offset, limit, page, data:[] }
                
                const reqBody = {
                    parentId: id,
                    recursive: true,
                    includeItemTypes: ['Audio'],
                    fields: ['MediaSources', 'MediaStreams']
                }
                const { Items: trackItems, TotalRecordCount } = await Emby.getRestJson('Items', reqBody) || { Items: [] }
                Object.assign(result, { total: TotalRecordCount, totalPage: Math.ceil(TotalRecordCount / limit) })
                if(trackItems && trackItems.length > 0) {
                    trackItems.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, Album, RunTimeTicks, Container, MediaSources } = item
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = (MediaSources && MediaSources[0]) || { }
                        const cover = Emby.getCover(item)
                        const artist = (ArtistItems && ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))) || []
                        const album = { id: AlbumId, name: Album }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
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
                Object.assign(result, { url: Emby.getStreamUrl(Id, Container, mediaSourceId, Tag) })
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
            Emby.getRestJson('Items', { ids: [id] }).then(json => {
                const { Items } = json
                if(Items && Items.length > 0) {
                    const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, } = Items[0]
                    
                    const result = {
                        id: Id, 
                        platform: Emby.CODE,
                        title: Name, 
                        cover: Emby.getCover(Items[0]),
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
            Emby.getRestJson('Items', reqBody).then(json => {
                const result = { id, platform: Emby.CODE, offset, limit, page, data: [] }
                const { Items } = json
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, } = item
                        
                        result.data.push({
                            id: Id, 
                            platform: Emby.CODE,
                            title: Name, 
                            //subtitle: AlbumArtist,
                            cover: Emby.getCover(item),
                            artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                            publishTime: toTrimString(ProductionYear),
                            ServerId,
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
    static albumDetail(Id) {
        return new Promise((resolve, reject) => {
            Emby.getRestJson(`Items/${Id}`).then(async json => {
                const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, } = json
                const cover = Emby.getCover(json)
                const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                const publishTime = toTrimString(ProductionYear)
                const result = new Album(Id, Emby.CODE, Name, cover, artist, '', publishTime)
                Object.assign(result,  { ServerId })
                const albumName = Name

                const reqBody = {
                    ParentId: Id,
                    Recursive: true,
                    Fields: ['MediaSources', 'MediaStreams']
                }
                const { Items: trackItems } = await Emby.getRestJson('Items', reqBody) || { Items: [] }
                if(trackItems && trackItems.length > 0) {
                    trackItems.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId, RunTimeTicks, Container, MediaSources } = item
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Emby.getCover(item)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: albumName }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
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
            const result = { id: Id, platform: Emby.CODE, data:[], offset, limit, page, }
            Emby.musicUserView().then(userView => {
                const { Id: Pid } = userView
                const reqBody = {
                    parentId: Pid,
                    recursive: true,
                    includeItemTypes: ['MusicAlbum'],
                    genreIds: [Id],
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                }
                Emby.getRestJson('Items', reqBody).then(json => {
                    const { Items, TotalRecordCount } = json
                    Object.assign(result,  { total: Math.ceil(TotalRecordCount / limit) })

                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, AlbumArtist, ArtistItems, ProductionYear, } = item
                        
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                subtitle: AlbumArtist,
                                cover: Emby.getCover(item),
                                artist: ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name })),
                                publishTime: toTrimString(ProductionYear),
                                ServerId,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    static genreDetailArtists(Id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Emby.CODE, data:[], offset, limit, page, }
            Emby.musicUserView().then(userView => {
                const { Id: Pid } = userView
                const reqBody = {
                    parentId: Pid,
                    recursive: true,
                    genreIds: [Id],
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                }
                Emby.getRestJson('Artists', reqBody).then(json => {
                    const { Items } = json
                    if(Items && Items.length > 0) {
                        Items.forEach(item => {
                            const { Id, Name, ServerId, } = item
                            result.data.push({
                                id: Id, 
                                platform: Emby.CODE,
                                title: Name, 
                                cover: Emby.getCover(item),
                                ServerId,
                            })
                        })
                    }
                    setTimeout(() => resolve(result), 202)
                })
            })
        })
    }

    static genreDetailAllSongs(Id) {
        return new Promise((resolve, reject) => {
            const result = { id: Id, platform: Emby.CODE, data:[] }
            const reqBody = {
                recursive: true,
                //mediaTypes: ['Audio'],
                IncludeItemTypes: ['Audio'],
                genreIds: [Id],
                fields: ['MediaSources'],
                SortBy: 'SortName',
                SortOrder: 'Ascending',
            }
            Emby.getRestJson('Items', reqBody).then(json => {
                const { Items } = json
                if(Items && Items.length > 0) {
                    Items.forEach(item => {
                        const { Id, Name, ServerId, ArtistItems, AlbumId,Album, RunTimeTicks, Container, MediaSources } = item
                        const { Id: mediaSourceId, Size, Bitrate, ETag  } = MediaSources[0] || { }
                        const cover = Emby.getCover(item)
                        const artist = ArtistItems.map(ar => ({ id: ar.Id, name: ar.Name }))
                        const album = { id: AlbumId, name: Album }
                        const duration = Math.floor(RunTimeTicks / 10000)
                        const track = new Track(Id, Emby.CODE, Name, artist, album, duration, cover)
                        Object.assign(track, {
                            url: Emby.getStreamUrl(Id, Container, mediaSourceId, ETag),
                            type: Playlist.NORMAL_TYPE,
                            Container,
                            mediaSourceId,
                            Tag: ETag,
                        })
                        result.data.push(track)
                    })
                    setTimeout(() => resolve(Emby.limitResult(result, 1024)), 202)
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
