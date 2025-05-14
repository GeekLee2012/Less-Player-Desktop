import { Lyric } from "../common/Lyric";
import { Track } from "../common/Track";
import { Album } from "../common/Album";
import {
    firstCharOfPinyin, isChineseChar,
    isEnglishChar, toLowerCaseTrimString,
    toTrimString, ipcRendererInvoke, 
    isDevEnv, isNetOnline,
    isBlank,
} from "../common/Utils";
import { FILE_PREFIX } from "../common/Constants";
import { United } from "./united";
import { useLocalMusicStore } from "../renderer/store/localMusicStore";
import { useSettingStore } from "../renderer/store/settingStore";
import { Category } from "../common/Category";
import { emitEvents } from "../common/EventBusWrapper";



const onTrackUpdated = (track) => emitEvents('track-coverUpdated', track)

export class LocalMusic {
    static CODE = 'local'

    //歌曲详情
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }
            //修正URL
            let { url } = result
            if (url && !url.includes(FILE_PREFIX)) {
                Object.assign(result, { url: (FILE_PREFIX + url) })
            }
            
            //检查网络状态
            const isOnline = await isNetOnline()
            if(isOnline) {
                //在线封面
                const { isUseOnlineCoverEnable } = useSettingStore()
                if (!Track.hasCover(track) || isUseOnlineCoverEnable) {
                    const onlineCandidate = await United.transferTrack(track, { isGetCover: true })
                    if (onlineCandidate) {
                        const { cover } = onlineCandidate
                        if (cover && track.cover != cover && !toTrimString(track.cover).startsWith('http')) {
                            Object.assign(result, { cover })
                            onTrackUpdated(result)
                        }
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
            let lyricText = await ipcRendererInvoke('load-lyric-embeded', result.url)
            Object.assign(result, { lyricEmbedded: !isBlank(lyricText) })
            
            let lyricTransText = null
            //本地歌词（同名文件）
            try {
                if (!lyricText) {
                    const loadedTexts = await ipcRendererInvoke('load-lyric-file', result.url)
                    lyricText = loadedTexts.text
                    lyricTransText = loadedTexts.transText
                }
            } catch (error) {
                console.log(error)
            }
            //检查网络状态
            const isOnline = await isNetOnline()
            
            //在线歌词
            let onlineCandidate = null
            if (!lyricText && isOnline) {
                onlineCandidate = await United.transferTrack(result, { isGetLyric: true })
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(result, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(result, { 
                    lyric: Lyric.parseFromText(lyricText), 
                    trans: Lyric.parseFromText(lyricTransText)
                })
            }

            if(isOnline) {
                //在线封面，顺便检查更新一下
                const { isUseOnlineCoverEnable } = useSettingStore()
                if (!Track.hasCover(track) || isUseOnlineCoverEnable) {
                    if (!onlineCandidate || !Track.hasCover(onlineCandidate)) {
                        onlineCandidate = await United.transferTrack(track, { isGetCover: true })
                    }
                    if (onlineCandidate) {
                        const { cover } = onlineCandidate
                        if (cover && result.cover != cover && !toTrimString(track.cover).startsWith('http')) {
                            Object.assign(result, { cover })
                            onTrackUpdated(result)
                        }
                    }
                }
            }
            resolve(result)
        })
    }

    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const result = { id, title: id, cover: '', data: [], about: '【本地歌曲 - 歌手】暂无简介' }
            resolve(result)
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const _name = toLowerCaseTrimString(id || '')
            const result = { id, platform: LocalMusic.CODE, offset, limit, page, total: 0, data: [] }
            if (_name.length < 1 || page > 1) return resolve(result)

            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                const filteredPlaylist = playlist.data.filter(item => {
                    const { artist } = item
                    if (artist && artist.length > 0) {
                        for (var i = 0; i < artist.length; i++) {
                            const { name } = artist[i]
                            if (toLowerCaseTrimString(name) === _name) return true
                        }
                    }
                    return false
                })
                //去重
                if (filteredPlaylist.length > 0) {
                    for (var i = 0; i < filteredPlaylist.length; i++) {
                        const track = filteredPlaylist[i]
                        const index = result.data.findIndex(item => item.id === track.id)
                        if (index < 0) result.data.push(track)
                    }
                }
            })
            setTimeout(() => resolve(result), 365)
        })
    }

    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const result = new Album(id, LocalMusic.CODE, id)
            result.about = '【本地歌曲 - 专辑】暂无简介'
            resolve(result)
        })
    }

    //专辑详情: 全部歌曲
    static albumDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const _name = toLowerCaseTrimString(id || '')
            const result = new Album(id, LocalMusic.CODE, id)
            if (_name.length < 1 || page > 1) {
                resolve(result)
                return
            }
            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                const filteredPlaylist = playlist.data.filter(item => {
                    const { album } = item
                    if (album && album.name) {
                        if (toLowerCaseTrimString(album.name) === _name) {
                            const { cover, publishTime } = item
                            Object.assign(result, { cover, artistName: Track.firstArtistName(item), publishTime })
                            return true
                        }
                    }
                    return false
                })
                //去重
                if (filteredPlaylist.length > 0) {
                    for (var i = 0; i < filteredPlaylist.length; i++) {
                        const track = filteredPlaylist[i]
                        const index = result.data.findIndex(item => item.id === track.id)
                        if (index < 0) result.data.push(track)
                    }
                }
            })
            setTimeout(() => resolve(result), 365)
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = toLowerCaseTrimString(keyword)
            const result = { platform: LocalMusic.CODE, offset, limit, page, data: [] }
            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                const filteredData = playlist.data.filter(item => {
                    const { title } = item
                    return toLowerCaseTrimString(title).includes(keyword)
                })
                //去重
                if (filteredData.length > 0) {
                    for (var i = 0; i < filteredData.length; i++) {
                        const track = filteredData[i]
                        const index = result.data.findIndex(item => item.id === track.id)
                        if (index < 0) result.data.push(track)
                    }
                }
            })
            resolve(result)
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = toLowerCaseTrimString(keyword)
            const result = { platform: LocalMusic.CODE, offset, limit, page, data: [] }
            const { localPlaylists } = useLocalMusicStore()
            const filteredData = localPlaylists.filter(playlist => {
                const { title } = playlist
                return toLowerCaseTrimString(title).includes(keyword)
            })
            if (filteredData.length > 0) result.data.push(...filteredData)
            resolve(result)
        })
    }

    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = toLowerCaseTrimString(keyword)
            const result = { platform: LocalMusic.CODE, offset, limit, page, data: [] }
            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                const filteredData = playlist.data.filter(item => {
                    const { name: albumTitle } = item.album
                    return toLowerCaseTrimString(albumTitle).includes(keyword)
                })
                //去重
                if (filteredData.length > 0) {
                    for (var i = 0; i < filteredData.length; i++) {
                        const track = filteredData[i]
                        if (!track.album || !track.album.name) continue
                        const index = result.data.findIndex(item =>
                            toLowerCaseTrimString(item.title) == toLowerCaseTrimString(track.album.name))
                        if (index < 0) {
                            const { album: al, cover, artist, publishTime } = track
                            const album = new Album(al.name, LocalMusic.CODE, al.name, cover, artist, null, toTrimString(publishTime))
                            result.data.push(album)
                        }
                    }
                }
            })
            resolve(result)
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            keyword = toLowerCaseTrimString(keyword)
            const result = { platform: LocalMusic.CODE, offset, limit, page, data: [] }
            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                playlist.data.forEach(item => {
                    const { artist } = item
                    if (artist && artist.length > 0) {
                        for (var i = 0; i < artist.length; i++) {
                            const { name } = artist[i]
                            if (toLowerCaseTrimString(name).includes(keyword)) {
                                const index = result.data.findIndex(item =>
                                    toLowerCaseTrimString(item.title) == toLowerCaseTrimString(name))
                                if (index < 0) {
                                    result.data.push({
                                        id: name,
                                        platform: LocalMusic.CODE,
                                        title: name,
                                        cover: null
                                    })
                                }
                            }
                        }
                    }
                })
            })
            resolve(result)
        })
    }

    //字母表分类
    static getAlphabetCategory() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const category = new Category("字母")
        category.add('全部', '-1')
        const array = alphabet.split('')
        for (var i = 0; i < array.length; i++) {
            category.add(array[i], toLowerCaseTrimString(array[i]))
        }
        category.add('其他', '0')
        return category
    }

    //歌手分类
    static artistCategories() {
        return new Promise((resolve, reject) => {
            const result = { platform: LocalMusic.CODE, data: [], alphabet: LocalMusic.getAlphabetCategory() }
            const category = new Category('默认')
            category.add('全部', -1)
            category.add('中文名', 1)
            category.add('英文名', 2)
            category.add('其他', 0)
            //category.add('日文名', 2)
            //category.add('韩文名', 3)

            result.data.push(category)
            setTimeout(() => resolve(result), 365)
        })
    }

    //提取分类
    static parseArtistCate(cate) {
        const result = { type: 'all', alphabet: 0 }
        try {
            const source = {
                lang: cate['默认'].item.value,
                alphabet: cate['字母'].item.value
            }
            return Object.assign(result, source)
        } catch (error) {
            //console.log(error)
        }
        return result
    }

    static isCharMatchAlphabet(char, charInAlphabet, lang) {
        //全部 + 全部
        if (lang < 0 && charInAlphabet < 0) return true

        const lwAlphabet = 'abcdefghijklmnopqrstuvwxyz'
        const lwChar = toLowerCaseTrimString(char)
        const lwPyChar = toLowerCaseTrimString(firstCharOfPinyin(char))

        //全部 + 字母
        if (lang < 0 && isEnglishChar(charInAlphabet)) {
            return lwPyChar == charInAlphabet
        }
        //全部 + 其他
        if (lang < 0 && charInAlphabet == 0) {
            return !lwAlphabet.includes(lwPyChar)
        }

        //中文 + 全部
        if (lang == 1 && charInAlphabet < 0) {
            return isChineseChar(char)
        }
        //中文 + 字母
        if (lang == 1 && isEnglishChar(charInAlphabet) && isChineseChar(char)) {
            return lwPyChar == charInAlphabet
        }

        //英文 + 全部
        if (lang == 2 && charInAlphabet < 0) {
            return isEnglishChar(char)
        }
        //英文 + 字母
        if (lang == 2 && isEnglishChar(charInAlphabet) && isEnglishChar(char)) {
            return lwChar == toLowerCaseTrimString(charInAlphabet)
        }

        //其他 + 全部/字母/其他
        //其他语言不好实现支持，暂时全部显示
        if (lang == 0) {
            return !isChineseChar(char) && !isEnglishChar(char)
        }

        return false
    }

    //歌手(列表)广场
    static artistSquare(cate, offset, limit, page) {
        //提取分类
        const resolvedCate = LocalMusic.parseArtistCate(cate)
        //分类
        const { lang, alphabet: charInAlphabet } = resolvedCate
        return new Promise((resolve, reject) => {
            const result = { platform: LocalMusic.CODE, cate, offset, limit, page, total: 0, data: [] }

            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                playlist.data.forEach(item => {
                    const { artist } = item
                    if (artist && artist.length > 0) {
                        for (var i = 0; i < artist.length; i++) {
                            const { name } = artist[i]
                            const title = toTrimString(name)
                            if (!title) continue
                            const firstChar = title.substring(0, 1)
                            if (LocalMusic.isCharMatchAlphabet(firstChar, charInAlphabet, lang)) {
                                const index = result.data.findIndex(item =>
                                    toLowerCaseTrimString(item.title) == toLowerCaseTrimString(title))
                                if (index < 0) {
                                    result.data.push({
                                        id: title,
                                        platform: LocalMusic.CODE,
                                        title,
                                        cover: null
                                    })
                                }
                            }
                        }
                    }
                })
            })
            setTimeout(() => resolve(result), 365)
        })
    }
}