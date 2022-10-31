import { Lyric } from './Lyric';
import { Playlist } from './Playlist';
import { toMmss } from './Times';

/** 
 * 被废弃的属性： 
 * isRadioType: 是否为电台歌曲;
 * isFMRadio: 是否为广播电台(当歌单类型为电台时); 
 */
export class Track {
    constructor(id, platform, title, artist, album, duration, cover, url, type, pid) {
        this.id = id ? id.toString() : ''
        this.platform = platform
        this.title = title
        //[ {id, name} ]
        this.artist = artist ? artist : []
        this.artistNotCompleted = false //数据不完整
        //{id, name}
        this.album = album ? album : ({ id: '', name: '' })
        //millis
        this.duration = duration ? duration : 0
        this.cover = cover
        this.url = url || ''
        this.lyric = new Lyric()
        this.type = type || 0 //与 Playlist中的type一致
        //this.channel = '' //channelId
        this.pid = pid || '' //playlistId
        //额外信息，当内容存在时显示，同时分别隐藏 artist、album
        this.extra1 = null
        this.extra2 = null
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

    static artistName(track) {
        let artistName = ''
        if(track && track.artist) {
            const names = []
            track.artist.forEach(e => names.push(e.name));
            artistName = names.join('、')
            artistName = artistName.slice(0, artistName.length)
        }
        return artistName
    }

    static hasLyric(track) {
        return track && track.lyric && Lyric.hasData(track.lyric)
    }

    static hasUrl(track) {
        return track && track.url && track.url.trim().length > 0
    }

    static hasCover(track) {
        if(!track || !track.cover) return false
        track.cover = track.cover.trim()
        if(track.cover.length < 1) return false
        return true
    }

    static hasId(track) {
        if(!track || !track.id) return false
        if(typeof(track.id) == 'number') return track.id > 0
        if(typeof(track.id) == 'string') return track.id.trim().length > 0
    }

    static firstArtistName(track) {
        return track ? track.artistName().split('、')[0] : ""
    }

    static lyricData(track) {
        return track && track.lyric ? track.lyric.data : []
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
        if(!t1 || !t2) return false
        return t1.id == t2.id && t1.platform == t2.platform
    }
}