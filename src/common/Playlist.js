export class Playlist {

    constructor(id, platform, cover, title, url, about) {
        this.id = id
        this.platform = platform
        this.cover = cover
        this.title = title
        this.url = url
        this.about = about ? about : ''
        this.data = []
        this.total = 0
        //歌单类型：普通、电台
        this.isRadioType = false
        //当歌单类型为电台时，是否为广播电台
        this.isFMRadio = false
    }

    addTrack(track) {
        this.data.push(track)
        return this
    }

}