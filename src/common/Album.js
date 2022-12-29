import { toTrimString } from './Utils';



export class Album {
    constructor(id, platform, title, cover, artist, company, publishTime, about, data) {
        this.id = id
        this.platform = platform
        this.title = toTrimString(title)
        this.cover = cover
        //[ {id, name} ]
        this.artist = artist ? artist : ([{ id: '', name: '未知歌手' }])
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
        if (!this.data) {
            this.data = []
        }
        this.data.push(track)
    }

    hasTracks() {
        return this.data && this.data.length > 0
    }
}