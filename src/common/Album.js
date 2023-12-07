import { toTrimString } from './Utils';



export class Album {
    constructor(id, platform, title, cover, artist, company, publishTime, about, data) {
        this.id = id
        this.platform = platform
        this.title = toTrimString(title)
        this.cover = cover
        //[ {id, name} ]
        this.artist = artist ? artist : ([{ id: '', name: '未知艺人' }])
        //发行公司
        this.company = company
        //发行时间
        this.publishTime = publishTime
        //流派
        this.school = ''
        //语种
        this.language = ''
        //简介
        this.about = toTrimString(about)
        this.data = data ? data : []
    }

    addTrack(track) {
        this.data = this.data || []
        this.data.push(track)
    }

    static hasTracks(album) {
        return album && album.data && album.data.length > 0
    }

    static artistName(album) {
        let artistName = ''
        if (album && album.artist && album.artist.length > 0) {
            const names = []
            album.artist.forEach(e => names.push(e.name));
            artistName = names.join('、')
            artistName = artistName.slice(0, artistName.length)
        }
        return artistName
    }

    static firstArtistName(album) {
        return album ? Album.artistName(album).split('、')[0].split('&')[0] : ''
    }

    static hasCover(album) {
        if (!album || !album.cover) return false
        album.cover = toTrimString(album.cover)
        if (album.cover.length < 1) return false
        if (album.cover == 'default_cover.png') return false
        return true
    }
}