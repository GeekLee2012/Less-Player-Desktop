export class Video {

    constructor(id, platform, title, vcType, cover, url, data, detailUrl) {
        this.id = id
        this.platform = platform
        this.title = title
        this.vcType = vcType    //0 => 单个视频，1 => 合集
        this.cover = cover
        this.url = url
        this.data = data || []
        this.detailUrl = detailUrl
        //视频其他相关参数等
    }

    static isCollectionType(video) {
        return video && video.vcType == 1
    }

    addDataItem(item) {
        this.data = this.data || []
        this.data.push(item)
    }

} 