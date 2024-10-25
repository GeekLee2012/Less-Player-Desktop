import { toLowerCaseTrimString, toTrimString } from './Utils';



export class Playlist {
    //普通歌单
    static NORMAL_TYPE = 0
    //普通电台歌单(无详情)
    static NORMAL_RADIO_TYPE = 1
    //FM广播电台歌单(无详情)
    static FM_RADIO_TYPE = 2
    //主播电台歌单
    static ANCHOR_RADIO_TYPE = 3
    //视频
    static VIDEO_TYPE = 4
    //流派
    static GENRE_TYPE = 5
    //目录
    static FOLDER_TYPE = 6
    //TODO
    static ANCHOR_RADIO_ID_PREFIX = "ARP_"
    //自定义列表
    static CUSTOM_ID_PREFIX = "CMP_"
    //本地自建歌单
    static LOCAL_PLAYLIST_ID_PREFIX = "LLP_"

    constructor(id, platform, cover, title, url, about, data, total, type, playCount) {
        this.id = id
        this.platform = toLowerCaseTrimString(platform)
        this.cover = cover
        this.title = toTrimString(title)
        this.url = toTrimString(url)
        this.about = toTrimString(about)
        this.data = data || []
        this.total = total || 0
        this.totalPage = 1
        //歌单类型：普通歌单、电台歌单、FM广播电台歌单、主播电台歌单
        this.type = type || 0
        //播放量
        this.playCount = playCount
    }

    addTrack(track) {
        this.data = this.data || []
        this.data.push(track)
        return this
    }

    static _resolveOldVersionType(item) {
        if(!item) return item
        const { type, isFMRadio, isRadioType } = item
        if (type >= 0) {
            //存在type属性，直接忽略
        } else if (isFMRadio) {
            Object.assign(item,  { type: Playlist.FM_RADIO_TYPE })
        } else if (isRadioType) {
            Object.assign(item,  { type: Playlist.NORMAL_RADIO_TYPE })
        } else {
            Object.assign(item,  { type: Playlist.NORMAL_TYPE })
        }
        return item
    }

    static _assertType(item, type) {
        if (!item) return false
        item.type = (item.type || Playlist.NORMAL_TYPE)
        //item = Playlist._resolveOldVersionType(item)
        return item.type === type
    }

    static isNormalType(item) { //普通歌单，必须设置平台
        return item && item.platform && Playlist._assertType(item, Playlist.NORMAL_TYPE)
    }

    static isNormalRadioType(item) {
        return Playlist._assertType(item, Playlist.NORMAL_RADIO_TYPE)
    }

    static isFMRadioType(item) {
        return Playlist._assertType(item, Playlist.FM_RADIO_TYPE)
    }

    static isAnchorRadioType(item) {
        return Playlist._assertType(item, Playlist.ANCHOR_RADIO_TYPE)
    }

    static isVideoType(item) {
        return Playlist._assertType(item, Playlist.VIDEO_TYPE)
    }

    static isGenreType(item) {
        return Playlist._assertType(item, Playlist.GENRE_TYPE)
    }

    static isFolderType(item) {
        return Playlist._assertType(item, Playlist.FOLDER_TYPE)
    }

    static isCustomType(item) {
        if(!item) return false
        const id = toTrimString(item.id)
        return id.startsWith(Playlist.CUSTOM_ID_PREFIX)
            //下面写法为兼容旧版本数据
            || (id.length == 16 && !item.platform)
    }

    static hasCover(playlist) {
        if (!playlist || !playlist.cover) return false
        playlist.cover = toTrimString(playlist.cover)
        if (playlist.cover.length < 1) return false
        if (playlist.cover == 'default_cover.png') return false
        return true
    }
}