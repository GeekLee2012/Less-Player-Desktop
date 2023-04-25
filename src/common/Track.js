import { Lyric } from './Lyric';
import { toTrimString } from './Utils';
import { toMmss } from './Times';



/** 
 * 被废弃的属性： 
 * isRadioType: 是否为电台歌曲;
 * isFMRadio: 是否为广播电台(当歌单类型为电台时); 
 */
export class Track {
    constructor(id, platform, title, artist, album,
        duration, cover, url, type,
        pid, mv, payPlay, payDownload) {
        this.id = toTrimString(id)
        this.platform = platform
        this.title = toTrimString(title)
        //[ {id, name} ]
        this.artist = artist ? artist : []
        //数据不完整
        this.artistNotCompleted = false
        //{id, name}
        this.album = album ? album : ({ id: '', name: '' })
        //Millis
        this.duration = duration ? duration : 0
        this.cover = cover
        this.url = toTrimString(url)
        this.lyric = new Lyric()
        this.lyricTrans = null
        this.type = type || 0 //与 Playlist中的type一致
        this.pid = toTrimString(pid) //playlistId
        //额外信息，当内容存在时显示，同时分别隐藏 artist、album
        this.extra1 = null
        this.extra2 = null
        //MV id
        this.mv = mv
        //VIP付费信息
        this.payPlay = payPlay
        this.payDownload = payDownload
    }

    mmssDuration() {
        return Track.mmssDuration(this)
    }

    //所有歌手名字
    artistName() {
        return Track.artistName(this)
    }

    firstArtistName() {
        return Track.firstArtistName(this)
    }

    hasId() {
        return Track.hasId(this)
    }

    hasUrl() {
        return Track.hasUrl(this)
    }

    hasCover() {
        return Track.hasCover(this)
    }

    hasLyric() {
        return Track.hasLyric(this)
    }

    lyricData() {
        return Track.lyricData(this)
    }

    static mmssDuration(track) {
        return toMmss(track.duration)
    }

    hasPid() {
        return Track.hasPid(this)
    }

    static isVip(track) {
        return Track.isVip(this)
    }

    static title(track) {
        return track ? track.title : ''
    }

    static artistName(track) {
        let artistName = ''
        if (track && track.artist) {
            const names = []
            track.artist.forEach(e => names.push(e.name));
            artistName = names.join('、')
            artistName = artistName.slice(0, artistName.length)
        }
        return artistName
    }

    static albumName(track) {
        return track && track.album ? track.album.name.trim() : null
    }

    static hasLyric(track) {
        return track && track.lyric && Lyric.hasData(track.lyric)
    }

    static hasUrl(track) {
        return track && track.url && track.url.trim().length > 0
    }

    static hasCover(track) {
        if (!track || !track.cover) return false
        track.cover = track.cover.trim()
        if (track.cover.length < 1) return false
        return true
    }

    static hasId(track) {
        if (!track || !track.id) return false
        const id = track.id
        if (typeof (id) == 'number') return id > 0
        if (typeof (id) == 'string') return id.trim().length > 0
    }

    static firstArtistName(track) {
        return track ? track.artistName().split('、')[0] : ""
    }

    static lyricData(track) {
        return track && track.lyric ? track.lyric.data : new Map()
    }

    static lyricOffset(track) {
        return track && track.lyric ? (track.lyric.offset || 0) : 0
    }

    static hasLyricTrans(track) {
        return track && track.lyricTrans && Lyric.hasData(track.lyricTrans)
    }

    static lyricTransData(track) {
        return track && track.lyricTrans ? track.lyricTrans.data : null
    }

    /*
    static fromChannel(channelTrack, type) {
        const track = new Track()
        if(channelTrack) {
            Object.assign(track, channelTrack)
            track.artist.push(channelTrack.radio)
            track.channel = channelTrack
            track.id = track.id + ""
        }
        track.type = type
        //track.isRadioType = true
        //track.isFMRadio = isFMRadio
        return track
    }
    */

    static isEquals(t1, t2) {
        if (!t1 || !t2) return false
        return t1.id == t2.id && t1.platform == t2.platform
    }

    static hasMv(track) {
        if (!track || !track.mv) return false
        const mv = track.mv.toString()
        if (typeof (mv) == 'number') return mv > 0
        if (typeof (mv) == 'string') return mv.trim().length > 0
    }

    static hasPid(track) {
        if (!track || !track.pid) return false
        const pid = track.pid
        if (typeof (pid) == 'number') return pid > 0
        if (typeof (pid) == 'string') return pid.trim().length > 0
    }

    static isVip(track) {
        if (!track) return false
        return track.payPlay
    }

    static hasArtist(track) {
        return track && track.artist
            && track.artist.length > 0
    }

    static isM3U8(track) {
        return Track.hasUrl(track) && track.url.includes(".m3u8")
    }

}