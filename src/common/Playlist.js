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
    }

    addTrack(track) {
        this.data.push(track)
        return this
    }
}