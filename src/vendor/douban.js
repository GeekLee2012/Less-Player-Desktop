import { getDoc, getJson ,postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { toYmd } from "../common/Times";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";


const CATEGORY_GROUP = {
    scenario: "心情场景",
    language: "语言年代",
    artist: "艺术家",
    genre: "风格流派"
}

export class DouBan {
    static CODE = 'douban'
    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
           const url = "https://fm.douban.com/j/v2/rec_channels?specific=all"
            
            getJson(url).then(json => {
                //console.log(json)
                const defaultCategory = new Category("默认")
                defaultCategory.add("推荐歌单", '歌单')

                const result = [ defaultCategory ]
                const channels = json.data.channels
                //console.log(channels)
                Object.keys(channels).forEach(key => {
                    //console.log(key + ": " + channels[key])
                    const cateName = CATEGORY_GROUP[key]
                    if(!cateName) return
                    const category = new Category(cateName)
                    channels[key].forEach(item => {
                        category.add(item.name, item.id)
                    })
                    result.push(category)
                })
                resolve(result)
            })
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/songlist/explore?type=hot&genre=0&limit=" + limit + "&sample_cnt=5"
            if(page > 1) {
                resolve(new Playlist())
                return
            } 
            getJson(url).then(json => {
                console.log(json)

                const result = { offset, limit, page, total: 0, data: [] }
                json.forEach(item => {
                    const cover = item.covers.large
                    const playlist = new Playlist(item.id, DouBan.CODE , cover, item.title)
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/songlist/" + id + "?kbps=192"
            getJson(url).then(json => {
                console.log(json)
                const result = new Playlist(id, DouBan.CODE, json.cover, json.title, url, json.intro)
                const list = json.songs
                list.forEach(item => {
                    const artist = item.singers.map(singer => ({ id: singer.id, name: singer.name }))
                    const album = { id: item.aid, name: item.albumtitle }
                    const duration = item.length * 1000
                    const cover = item.picture.trim()
                    const track = new Track(item.sid, DouBan.CODE, item.title, artist, album, duration, cover)
                    track.url = item.url
                    track.ssid = item.ssid
                    result.addTrack(track)
                })
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const url = "https://fm.douban.com/j/v2/lyric" + "?sid=" + id + "&ssid=" + track.ssid
            getJson(url).then(json => {
                console.log(json)
                const lyricText = json.lyric
                track.lyric = Lyric.parseFromText(lyricText)
                resolve(track)
            })
        })
    }

}