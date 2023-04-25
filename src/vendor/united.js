import { QQ } from "../vendor/qq";
import { NetEase } from "../vendor/netease";
import { KuWo } from "../vendor/kuwo";
import { KuGou } from "../vendor/kugou";
import { DouBan } from "../vendor/douban";
import { RadioCN } from "../vendor/radiocn";
import { Qingting } from "../vendor/qingting";
import { Ximalaya } from "../vendor/ximalaya";



const vendors = [
    QQ, NetEase,
    KuWo, KuGou,
    DouBan, RadioCN,
    Qingting, Ximalaya
]

const getVendor = (code) => {
    for (let i in vendors) {
        const vender = vendors[i]
        if (vender.CODE === code) return vender
    }
    return null
}

/** 统一平台，协调处理公共业务 */
export class United {
    static CODE = 'united'

    //TODO 互惠互助、互通有无、移花接木？奏是介些说法啦 ~
    static async transferTrack(track) {
        const fromPlatform = track.platform
        const title = track.title
        const artist = track.firstArtistName()
        let keyword = title + " " + artist
        keyword = keyword.trim()
        return new Promise(async (resolve, reject) => {
            let candidates = []
            let result = null
            const top = 3

            //console.log('<------ Transfer Begin ------>')
            whereDreamBegins:
            for (var i = 0; i < vendors.length; i++) {
                const vendor = vendors[i]
                const songs = await vendor.searchSongs(keyword)
                candidates = songs.data
                //TODO 匹配算法才是关键
                //candidates = United.matchAndSort(track, candidates)
                if (candidates.length < 1) continue
                for (var j = 0; j < top; j++) {
                    const candidate = candidates[j]
                    result = await vendor.playDetail(candidate.id, candidate)
                    if (!result.hasUrl()) continue

                    const lyric = await vendor.lyric(candidate.id, candidate)
                    track.url = result.url
                    track.lyric = lyric
                    track.borrow = candidate

                    break whereDreamBegins
                }
            }
            //console.log('<------ Transfer End ------>')
            resolve(track)
        })
    }

    /** 评估匹配度(Matching Degree)，并排序
     * @param reference 参照对象
     * @param array 待匹配排序数组
     */
    static matchAndSort(reference, array) {

    }

}