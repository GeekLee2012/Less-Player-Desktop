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
    }

    mmssDuration() {
        return toMmss(this.duration)
    }

    //所有歌手名字
    artistName() {
        let artistName = ''
        if(this.artist) {
            const names = []
            this.artist.forEach(e => names.push(e.name));
            artistName = names.join('、')
            artistName = artistName.slice(0, artistName.length)
        }
        return artistName
    }

    firstArtistName() {
        return this.artistName().split('、')[0]
    }

    hasId() {
        if(!this.id) return false
        if(typeof(this.id) == 'number') return this.id > 0
        if(typeof(this.id) == 'string') return this.id.trim().length > 0
    }

    hasUrl() {
        return this.url && this.url.trim().length > 0
    }

    hasCover() {
        if(!this.cover) return false
        this.cover = this.cover.trim()
        if(this.cover.length < 1) return false
        return this.cover != DEFAULT_COVER
    }

    hasLyric() {
        return this.lyric && this.lyric.hasData()
    }

    lyricData() {
        return this.lyric.data
    }

}