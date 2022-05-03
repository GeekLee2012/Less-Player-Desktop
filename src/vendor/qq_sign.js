import { getDoc, getJson, postJson } from "../common/HttpClient";
import { Category } from "../common/Category";
import { Playlist } from "../common/Playlist";

const DEFAULT_CATE = new Category("默认")
DEFAULT_CATE.add("全部分类", '')

const REQUEST_COMMON = {
    cv: 4747474,
    ct: 24,
    format: "json",
    inCharset: "utf-8",
    outCharset: "utf-8",
    notice: 0,
    platform: "yqq.json",
    needNewCode: 1,
    uin: 0,
    g_tk_new_20200303: 5381,
    g_tk: 5381
}

const moduleReq = (module, method, param) => {
    return { module,  method, param }
}

const squareReqBody = (offset, limit) => {
    return {
        comm: REQUEST_COMMON,
        req_1: moduleReq("music.playlist.PlaylistSquare", 
            "GetRecommendWhole", 
            {
                IsReqFeed: true,
                FeedReq: {
                    From: offset,
                    Size: limit
                }
            })
    }
}

const sign = "zzb9aee396bw078y31dliqkyge0gqn1tabe36f72e"

/* 最新版API */
export class QQ {
    static CODE = "qq"
    //全部分类
    static categories() {
        return new Promise((resolve, reject) => {
           const url = "https://y.qq.com/n/ryqq/category/"
            getDoc(url).then(doc => {
                const scriptText = doc.body.querySelector("script").textContent
                const KEY1 = "window.__INITIAL_DATA__"
                const KEY2 = "\"categories\":"
                const KEY3 = ",\"playlist\":"
                const test = scriptText.indexOf(KEY1)
                const from = scriptText.indexOf(KEY2)
                const to = scriptText.indexOf(KEY3)

                const result = [ DEFAULT_CATE ]

                if(test != 1 && from != -1 && to != -1) {
                    const jsonText = scriptText.split(KEY2)[1].split(KEY3)[0]
                    const json = JSON.parse(jsonText)

                    const cateNameCached = []
                    json.forEach(cate => {
                        const cateName = cate.categoryGroupName
                        const category = new Category(cateName)
                        const items = cate.items
                        items.forEach(item => {
                            const name = item.categoryName
                            const id = item.categoryId
                            category.add(name, id);
                        })
                        if(cateNameCached.includes(cateName)) return
                        result.push(category)
                        cateNameCached.push(cateName)
                    })
                }
                resolve({ platform: QQ.CODE, data: result })
            })
        })
    }

    //歌单广场(列表)
    static square (cate, offset, limit, page) {
        return new Promise((resolve, reject) => {
            const url = "https://u.y.qq.com/cgi-bin/musics.fcg"
                + "?_=" + Date.now() + "&sign=" + sign
            limit = 100
            const reqBody = JSON.stringify(squareReqBody(offset, limit))
            postJson(url, reqBody).then(json => {
                let result = { offset, limit, page, data: [] }
                if(json.req_1.code == 0) {
                    const data = json.req_1.data
                    const feedList = data.FeedRsp.List
                    feedList.forEach(feed => {
                        const playlist = feed.Playlist
                        const item = playlist.basic
                        const cover = item.cover.big_url

                        const detail = new Playlist(item.tid, QQ.CODE, cover, item.title) 
                        detail.about = item.desc
                        result.data.push(detail)
                    })
                }
                resolve(result)
            })
        })
    }
}