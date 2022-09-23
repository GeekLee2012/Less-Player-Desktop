import { Lyric } from './Lyric';
import { toMmss } from './Times';

const DEFAULT_COVER = 'default_cover.png'

export class Track {
    constructor(id, platform, title, artist, album, duration, cover) {
        this.id = id ? (id + '') : ''
        this.platform = platform
        this.title = title
        //[ {id, name} ]
        this.artist = artist ? artist : []
        this.artistNotCompleted = false //数据是否不完整
        //{id, name}
        this.album = album
        //millis
        this.duration = duration ? duration : 0
        this.cover = cover ? cover : DEFAULT_COVER
        this.url = ''
        this.lyric = new Lyric()
        this.isRadioType = false //是否为电台歌曲
        //当歌单类型为电台时，是否为广播电台
        this.isFMRadio = false
        this.channel = '' //channelId
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
        return track.url && track.url.trim().length > 0
    }

    static hasCover(track) {
        if(!track || !track.cover) return false
        track.cover = track.cover.trim()
        if(track.cover.length < 1) return false
        return track.cover != DEFAULT_COVER
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

    static fromChannel(channelTrack, isFMRadio) {
        const track = new Track()
        if(channelTrack) {
            Object.assign(track, channelTrack)
            track.artist.push(channelTrack.radio)
            track.channel = channelTrack
        }
        track.isRadioType = true
        track.isFMRadio = isFMRadio
        return track
    }

    static isEquals(t1, t2) {
        if(!t1 || !t2) return false
        return t1.id == t2.id
            && t1.platform == t2.platform
    }
}