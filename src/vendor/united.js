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
    DouBan,
    /* RadioCN,
    Qingting, Ximalaya */
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

    //互惠互助、互通有无、移花接木？奏是介些说法啦 ~
    static transferTrack(track) {
        const { platform: fromPlatform, title, artistName, albumName, duration } = track
        return new Promise(async (resolve, reject) => {
            const result = {}

            resolve(result)
        })
    }

}