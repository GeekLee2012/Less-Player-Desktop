import { toTrimString } from './Utils';



export class Playlist {
    //普通歌单
    static NORMAL_TYPE = 0
    //普通电台歌单(无详情)
    static NORMAL_RADIO_TYPE = 1
    //FM广播电台歌单(无详情)
    static FM_RADIO_TYPE = 2
    //主播电台歌单
    static ANCHOR_RADIO_TYPE = 3
    //TODO
    static ANCHOR_RADIO_ID_PREFIX = "ARP_"
    //自定义列表
    static CUSTOM_ID_PREFIX = "CMP_"

    constructor(id, platform, cover, title, url, about, data, total, type, listenNum) {
        this.id = id
        this.platform = platform
        this.cover = cover
        this.title = toTrimString(title)
        this.url = toTrimString(url)
        this.about = toTrimString(about)
        this.data = data || []
        this.total = total || 0
        //歌单类型：普通歌单、电台歌单、FM广播电台歌单、主播电台歌单
        this.type = type || 0
        //播放量
        this.listenNum = listenNum
    }

    addTrack(track) {
        this.data.push(track)
        return this
    }

    static resolveOldVersionType(item) {
        if (item.isFMRadio) {
            item.type = Playlist.FM_RADIO_TYPE
        } else if (item.isRadioType) {
            item.type = Playlist.NORMAL_RADIO_TYPE
        } else if (!item.type) {
            item.type = Playlist.NORMAL_TYPE
        }
        return item
    }

    static doAssertType(item, type) {
        item = Playlist.resolveOldVersionType(item)
        return item && item.type === type
    }

    static isNormalType(item) { //普通歌单，必须设置平台
        return item.platform && Playlist.doAssertType(item, Playlist.NORMAL_TYPE)
    }

    static isNormalRadioType(item) {
        return Playlist.doAssertType(item, Playlist.NORMAL_RADIO_TYPE)
    }

    static isFMRadioType(item) {
        return Playlist.doAssertType(item, Playlist.FM_RADIO_TYPE)
    }

    static isAnchorRadioType(item) {
        return Playlist.doAssertType(item, Playlist.ANCHOR_RADIO_TYPE)
    }

    static isCustomType(item) {
        const id = toTrimString(item.id)
        return id.startsWith(Playlist.CUSTOM_ID_PREFIX)
            //下面写法为兼容旧版本数据
            || (id.length == 16 && !item.platform)
    }

}