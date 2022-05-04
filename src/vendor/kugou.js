import { getDoc, postJson, getJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";
import { Track } from "../common/Track";
import { Lyric } from "../common/Lyric";
import { Album } from "../common/Album";
import CryptoJS from 'crypto-js';

const REQ_ID = 'e2db8a61-afdb-11ec-9d7b-c9324a8678ec'

const COOKIES =  {
    kg_mid: "b1ce9c8ff7a5081551d9fe09a396d9c1",
    kg_dfid: "11TXg30ah9CE2JoRol2OeAmD",
    kg_dfid_collect: "d41d8cd98f00b204e9800998ecf8427"
}

const searchParam = (param) => {
    const md5Key = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
    param = param.split('&').sort().join('')
    return md5Key + param + md5Key
}

const getDataUrl = (hash, albumId) => {
    return "https://wwwapi.kugou.com/yy/index.php?r=play/getdata" 
        + "&hash=" + hash + "&dfid=" + COOKIES.kg_dfid
        + "&appid=1014" + "&mid=" + COOKIES.kg_mid
        + "&platid=4" + "&album_id=" + albumId
        + "&_="
}

export class KuGou {
    static CODE = 'kugou'
    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
            const defaultCategory = new Category("默认")
            defaultCategory.add("推荐", '1-5-0')

            const otherCategory = new Category("其他")
            otherCategory.add("最热", '1-6-0')
            otherCategory.add("最新", '1-7-0')
            otherCategory.add("热藏", '1-3-0')
            otherCategory.add("飙升", '1-8-0')

            otherCategory.add("未知", '1-0-0')
            //otherCategory.add("未知2", '1-9-0')

            const result = [ defaultCategory, otherCategory ]
            resolve({ platform: KuGou.CODE, data: result })
        })
    }

    //歌单(列表)广场
    static square(cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            let url = "https://www.kugou.com/yy/special/index/" + cate + ".html"
            //TODO
            const result = { offset, limit, page, data: [] }
            if(offset > 0) {
                resolve(result)
                return 
            }
            getDoc(url).then(doc => {
                const list = doc.querySelectorAll('.spe #ulAlbums li')
                list.forEach(el => {
                    const id = el.getAttribute('class').split('_')[1]
                    const cover = el.querySelector('.pic img').getAttribute('_src')
                    const title = el.querySelector('.detail a').textContent
                    const about = el.querySelector('.detail .text').textContent

                    const playlist = new Playlist(id, KuGou.CODE, cover, title)
                    playlist.about = about
                    result.data.push(playlist)
                })
                resolve(result)
            })
        })
    }

    //歌单详情
    static playlistDetail(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/special/single/" + id + ".html"
            getDoc(url).then(doc => {
                //console.log(doc)
                const cover = doc.querySelector('.specialPage .pic img').getAttribute('_src')
                const title = doc.querySelector('.specialPage .pic img').getAttribute('alt')
                const about = doc.querySelector('.specialPage .more_intro').textContent

                const result = new Playlist(id, KuGou.CODE, cover, title, null, about)
                //Tracks
                let key = 'var data='
                const scripts = doc.head.getElementsByTagName('script')
                let scriptText = null
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = 'specialData ='
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText.substring(0, scriptText.length - 1)
                    //console.log(scriptText)
                    const json = JSON.parse(scriptText)

                    //console.log(json)
                    json.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if(authors && authors.length > 0) {
                            trackCover = authors[0].sizable_avatar.replace('{size}', '400')
                            const arData = authors.map(ar => ({
                                id: ar.author_id, name: ar.author_name
                            }))
                            artist.push(...arData)
                        }
                        const track = new Track(item.audio_id, KuGou.CODE, item.songname, artist, album, duration, trackCover)
                        track.hash = item.hash
                        result.addTrack(track)
                    })
                }
                resolve(result)
            })
        })
    }

    //歌曲播放详情：url、cover、lyric等
    static playDetail(id, track) {
        return new Promise((resolve, reject) => {
            const url = getDataUrl(track.hash, track.album.id)
            getJson(url).then(json => {
                const result = new Track(track.id, KuGou.CODE)
                result.url = json.data.play_url
                result.cover = json.data.img
                const lyricText = json.data.lyrics
                //console.log(lyricText)
                result.lyric = Lyric.parseFromText(lyricText)
                resolve(result)
            })
        })
    }

    //歌词
    static lyric(id) {
        return new Promise((resolve, reject) => {
            const result = new Lyric()
            resolve(result)
        })
    }

    //歌手详情：Name、Cover、简介(如果有)等
    static artistDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/singer/" + id + ".html"
            getDoc(url).then(doc => {
                const cover = doc.querySelector('.sng_ins_1 .top img').getAttribute('_src')
                const name = doc.querySelector('.sng_ins_1 .top .intro strong').textContent
                const about = doc.querySelector('.sng_ins_1 #singer_content').textContent

                const result = { id, name, cover, about }
                resolve(result)
            })
        })
    }

    //歌手详情: 全部歌曲
    static artistDetailAllSongs(id, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/"
                + "?r=singer/song&sid=" + id 
                + "&p=" + page + "&t=" + Date.now()
            if(page > 1) {
                resolve({ offset, limit, page, total: 0, data: [] })
            }
            postJson(url).then(json => {
                console.log(json)
                const total = json.total
                const data = []
                const list = json.data
                list.forEach(item => {
                    const artist = [ { id, name: item.author_name } ]
                    const album = { id: item.album_id, name: item.album_name }
                    const duration = item.duration
                    const track = new Track(item.songid, KuGou.CODE, item.songname, artist, album, duration)
                    track.hash = item.hash
                    data.push(track)
                })
                const result = { offset, limit, page, total, data }
                resolve(result)
            })
        })
    }
    
    //歌手详情: 专辑
    static artistDetailAlbums(id, offet, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/yy/"
                + "?r=singer/album&sid=" + id 
                + "&p=" + page + "&t=" + Date.now()
            postJson(url).then(json => {
                console.log(json)
                const total = json.total
                const data = []
                const list = json.data
                list.forEach(item => {
                    const artist = [ { id, name: item.singername } ]
                    const track = new Album(item.albumid, KuGou.CODE, item.albumname, item.img, artist)
                    data.push(track)
                })
                const result = { offet, limit, page, total, data }
                resolve(result)
            })
        })
    }

    //专辑详情
    static albumDetail(id) {
        return new Promise((resolve, reject) => {
            const url = "https://www.kugou.com/album/" + id + ".html"
            getDoc(url).then(doc => {
                //console.log(doc)
                const cover = doc.querySelector('.pic img').getAttribute('_src')
                const detailItems = doc.querySelector('.detail').childNodes
                //detailItems.forEach(i => console.log(i))
                const title = detailItems.item(2).textContent
                const artistName = detailItems.item(6).textContent
                const publishTime = detailItems.item(12).textContent
                const about = doc.querySelector('.intro').textContent
                const artist = [ {id: 0, name: artistName } ]

                //Tracks
                let key = 'var data='
                const scripts = doc.body.getElementsByTagName('script')
                let scriptText = null
                for(var i = 0; i < scripts.length; i++) {
                    const scriptCon = scripts[i].innerHTML
                    if(scriptCon && scriptCon.includes(key)) {
                        scriptText = scriptCon
                        break
                    }
                }

                const data = []
                if(scriptText) {
                    scriptText = scriptText.split(key)[1]
                    key = '];'
                    scriptText = scriptText.split(key)[0].trim()
                    scriptText = scriptText + "]"
                    //console.log(scriptText)
                    const json = JSON.parse(scriptText)
                    //console.log(json)    
                    json.forEach(item => {
                        const artist = []
                        const album = { id: item.album_id, name: item.album_name }
                        const duration = item.duration
                        let trackCover = null
                        const authors = item.authors
                        if(authors && authors.length > 0) {
                            trackCover = authors[0].sizable_avatar.replace('{size}', '400')
                            const arData = authors.map(ar => ({
                                id: ar.author_id, name: ar.author_name
                            }))
                            artist.push(...arData)
                        }
                        const track = new Track(item.audio_id, KuGou.CODE, item.songname, artist, album, duration, trackCover)
                        track.hash = item.hash
                        data.push(track)
                    })
                }

                const result = new Album(id, KuGou.CODE, title, cover, artist, null, publishTime, about, data)
                resolve(result)
            })
        })
    }

    //搜索: 歌曲
    static searchSongs(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const now = Date.now()
            const callbackFn = 'callback123'
            let param = "callback=" + callbackFn + "&keyword=" + keyword + "&page=" + page + "&pagesize=" + limit 
                        + "&bitrate=0&isfuzzy=0&inputtype=0&platform=WebFilter&userid=0&clientver=2000"
                        + "&iscorrection=1&privilege_filter=0&token=&srcappid=2919" 
                        + "&clienttime=" + now + "&mid=" + now + "&uuid=" + now + "&dfid=-"
            const md5Param = searchParam(param)
            const signature = CryptoJS.MD5(md5Param).toString().toUpperCase()
            const url = "https://complexsearch.kugou.com/v2/search/song" + "?" + param + "&signature=" + signature
            
            getJson(url).then(jsonp => {
                //console.log(jsonp)
                let jsonText = jsonp.split(callbackFn + "(")[1].trim()
                jsonText = jsonText.substring(0, jsonText.length - 1)
                const json = JSON.parse(jsonText)
                console.log(json)

                const data = json.data.lists.map(item => {
                    const artist = item.Singers
                    const album = { id: item.AlbumID, name: item.AlbumName }
                    const duration = item.Duration * 1000
                    const track = new Track(item.ID, KuGou.CODE, item.SongName, artist, album, duration, item.pic)
                    track.hash = item.FileHash
                    return track
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        })
    }

    //搜索: 歌单
    static searchPlaylists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const now = Date.now()
            const callbackFn = 'callback123'
            let param = "callback=" + callbackFn + "&keyword=" + keyword + "&page=" + page + "&pagesize=" + limit 
                        + "&platform=WebFilter&userid=0&clientver=2000"
                        + "&iscorrection=1&privilege_filter=0&token=&srcappid=2919" 
                        + "&clienttime=" + now + "&mid=" + now + "&uuid=" + now + "&dfid=-"
            const md5Param = searchParam(param)
            const signature = CryptoJS.MD5(md5Param).toString().toUpperCase()
            const url = "https://complexsearch.kugou.com/v1/search/special" + "?" + param + "&signature=" + signature
            
            getJson(url).then(jsonp => {
                //console.log(jsonp)
                let jsonText = jsonp.split(callbackFn + "(")[1].trim()
                jsonText = jsonText.substring(0, jsonText.length - 1)
                const json = JSON.parse(jsonText)
                console.log(json)

                const data = json.data.lists.map(item => {
                    const track = new Playlist(item.specialid, KuGou.CODE, item.img, item.specialname, item.intro)
                    return track
                })
                const result = { offset, limit, page, data }
                resolve(result)
            })
        })
    }
    
    //搜索: 专辑
    static searchAlbums(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, data: [] }
            resolve(result)
        })
    }

    //搜索: 歌手
    static searchArtists(keyword, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const result = { offset, limit, page, data: [] }
            resolve(result)
        })
    }

}