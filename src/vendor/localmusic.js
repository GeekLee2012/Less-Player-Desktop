import { Lyric } from "../common/Lyric";
import { Track } from "../common/Track";
import { Album } from "../common/Album";
import { toLowerCaseTrimString, toTrimString, useIpcRenderer } from "../common/Utils";
import { FILE_PREFIX } from "../common/Constants";
import { United } from "./united";
import { useLocalMusicStore } from "../renderer/store/localMusicStore";
import { useSettingStore } from "../renderer/store/settingStore";
import { Playlist } from "../common/Playlist";



const ipcRenderer = useIpcRenderer()

export class LocalMusic {
    static CODE = 'local'

    //歌曲详情
    static playDetail(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = new Track(id, LocalMusic.CODE)
            //修正url
            let url = track.url
            if (!url.includes(FILE_PREFIX)) Object.assign(result, { url: (FILE_PREFIX + url) })
            //封面
            if (Track.hasCover(track) && !track.cover.startsWith('http')) {
                const { isUseOnlineCoverEnable } = useSettingStore()
                if (isUseOnlineCoverEnable) {
                    const onlineCandidate = await United.transferTrack(track, true, true)
                    if (onlineCandidate) {
                        const { cover } = onlineCandidate
                        Object.assign(track, { cover })
                    }
                }
            }
            resolve(result)
        })
    }

    //歌词
    static lyric(id, track) {
        return new Promise(async (resolve, reject) => {
            const result = { id, platform: LocalMusic.CODE, lyric: null, trans: null }
            //内嵌歌词
            let lyricText = track.embeddedLyricText
            //本地歌词（同名文件）
            try {
                if (!lyricText && ipcRenderer) {
                    lyricText = await ipcRenderer.invoke('load-lyric-file', track.url)
                }
            } catch (error) {
                console.log(error)
            }
            //在线歌词
            let onlineCandidate = null
            if (!lyricText) {
                onlineCandidate = await United.transferTrack(track, true, true)
                if (onlineCandidate) {
                    const { lyric, lyricTrans } = onlineCandidate
                    Object.assign(result, { lyric, trans: lyricTrans })
                }
            } else {
                Object.assign(result, { lyric: Lyric.parseFromText(lyricText) })
            }
            //封面，顺便更新一下
            if (Track.hasCover(track) && !track.cover.startsWith('http')) {
                const { isUseOnlineCoverEnable } = useSettingStore()
                if (isUseOnlineCoverEnable) {
                    if (!onlineCandidate) onlineCandidate = await United.transferTrack(track, true, true)
                    if (onlineCandidate) {
                        const { cover } = onlineCandidate
                        Object.assign(track, { cover })
                    }
                }
            }
            resolve(result)
        })
    }

    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const result = { id, title: id, cover: 'default_cover.png', data: [], about: '【本地歌曲 - 歌手】' }
            resolve(result)
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const _name = (id || '').toLowerCase().trim()
            const result = { id, platform: LocalMusic.CODE, offset, limit, page, total: 0, data: [] }
            if (_name.length < 1 || page > 1) {
                resolve(result)
                return
            }
            const { localPlaylists } = useLocalMusicStore()
            localPlaylists.forEach(playlist => {
                const filteredPlaylist = playlist.data.filter(item => {
                    const { artist } = item
                    if (artist && artist.length > 0) {
                        for (var i = 0; i < artist.length; i++) {
                            const { name } = artist[i]
                            if (toLowerCaseTrimString(name) === _name) {
                                return true
                            }
                        }
                    }
                    return false
                })
                //if (filteredPlaylist.length > 0) result.data.push(...filteredPlaylist)
                //去重
                if (filteredPlaylist.length > 0) {
                    for (var i = 0; i < filteredPlaylist.length; i++) {
                        const track = filteredPlaylist[i]
                        const index = result.data.findIndex(item => item.id === track.id)
                        if (index < 0) result.data.push(track)
                    }
                }
            })
            resolve(result)
        })
    }

    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const result = new Album(id, LocalMusic.CODE, id)
            result.about = '【本地歌曲 - 专辑】'
            resolve(result)
        })
    }

    //专辑详情: 全部歌曲
    static albumDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const _name = (id || '').toLowerCase().trim()
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
                        if (album.name.toLowerCase().trim() === _name) {
                            const { cover, publishTime } = item
                            Object.assign(result, { cover, artistName: Track.firstArtistName(item), publishTime })
                            return true
                        }
                    }
                    return false
                })
                //if (filteredPlaylist.length > 0) result.data.push(...filteredPlaylist)
                //去重
                if (filteredPlaylist.length > 0) {
                    for (var i = 0; i < filteredPlaylist.length; i++) {
                        const track = filteredPlaylist[i]
                        const index = result.data.findIndex(item => item.id === track.id)
                        if (index < 0) result.data.push(track)
                    }
                }
            })
            resolve(result)
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
}