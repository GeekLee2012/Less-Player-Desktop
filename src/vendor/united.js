import { QQ } from "../vendor/qq";
import { NetEase } from "../vendor/netease";
import { KuWo } from "../vendor/kuwo";
import { KuGou } from "../vendor/kugou";
import { DouBan } from "../vendor/douban";
import { RadioCN } from "../vendor/radiocn";
import { Qingting } from "../vendor/qingting";
import { Ximalaya } from "../vendor/ximalaya";
import { Track } from "../common/Track";



const vendors = [
    QQ, NetEase,
    KuWo, KuGou,
    /* DouBan,
    RadioCN,
    Qingting, Ximalaya */
]

const getVendor = (code) => {
    for (let i in vendors) {
        const vendor = vendors[i]
        if (vendor.CODE === code) return vendor
    }
    return null
}

/** 统一平台，协调处理公共业务 */
export class United {
    static CODE = 'united'
    static NULL_CODE = 'NULLL_CODEEE'

    static tranformTitle(title, artistName) {
        const tTitle = title || ''
        const tArtistName = artistName || United.NULL_CODE
        return tTitle.replace(tArtistName, '')
            .replace(/-/g, '')
    }

    static tranformArtistName(name) {
        const tName = name || ''
        return tName.replace('网络歌手', '')
            .replace('未知歌手', '')
            .replace('未知艺人', '')
            .replace('未知艺术家', '')
            .replace('群星', '')
    }

    //互惠互助、互通有无、移花接木？奏是介些说法啦 ~
    static transferTrack(track, ignoreUrl, ignoreAlbum) {
        return new Promise(async (resolve, reject) => {
            let result = null
            const { platform: fromPlatform, title } = track
            const firstArtistName = Track.firstArtistName(track)
            const tTitle = United.tranformTitle(title, firstArtistName)
            const tArtistName = United.tranformArtistName(firstArtistName)
            const keyword = `${tTitle} ${tArtistName}`

            const filteredVendors = vendors.filter(v => (v.CODE != fromPlatform))
            const fromVendor = getVendor(fromPlatform)
            if (fromVendor) filteredVendors.push(fromVendor)

            for (var i = 0; i < filteredVendors.length; i++) {
                const vendor = filteredVendors[i]
                //if (vendor.CODE == fromPlatform || vendor.CODE == DouBan.CODE) continue
                const searchResult = await vendor.searchSongs(keyword)
                const { data: candidates } = searchResult
                if (!candidates || candidates.length < 1) continue
                result = await United.matchFromCandidates(track, candidates.slice(0, Math.min(candidates.length, 20)), ignoreUrl, ignoreAlbum)
                if (result) break
            }
            resolve(result)
        })
    }

    //TODO 匹配算法，后续再完善
    static matchFromCandidates(track, candidates, ignoreUrl, ignoreAlbum) {
        return new Promise(async (resolve, reject) => {
            let result = null
            const { id, platform, title, artist, duration } = track
            const albumName = Track.albumName(track)
            for (var i = 0; i < candidates.length; i++) {
                const candidate = candidates[i]
                const { id: cId, title: cTitle,
                    platform: cPlatform, duration: cDuration } = candidate
                //跳过自身
                if (id == cId && platform == cPlatform) continue

                //开始评估、匹配
                const cArtistName = Track.artistName(candidate)
                const cAlbumName = Track.albumName(candidate)
                let score = 0.05, hits = 0
                //歌曲名称
                const _title = (title || United.NULL_CODE)
                const isSimilar = cTitle.toLowerCase().includes(_title.toLowerCase())
                //歌曲名称没有任何相同
                if (!isSimilar) continue
                score += 0.25
                if (title == cTitle) {
                    score += 0.05
                    ++hits
                }

                //歌手
                let isArtistMissed = true //未命中歌手
                if (artist && cArtistName) {
                    for (var j = 0; j < artist.length; j++) {
                        const { name } = artist[j]
                        const _name = (name || United.NULL_CODE)
                        if (cArtistName.toLowerCase().includes(_name.toLowerCase())) {
                            score += 0.2
                            isArtistMissed = false
                            ++hits
                            break
                        }
                    }
                }
                //专辑
                const _albumName = (albumName || United.NULL_CODE)
                if (ignoreAlbum) {
                    score += 0.2
                    ++hits
                } else if (_albumName == cAlbumName) {
                    score += 0.2
                    ++hits
                } else if (cAlbumName.toLowerCase().includes(_albumName.toLowerCase())) {
                    score += 0.15
                } else {
                    score += 0.05
                }

                //同歌曲名、同专辑名、不同歌手，大概率为不同歌曲
                //不同歌手，也算了，还是听坚持原唱
                if (hits <= 2 && isArtistMissed) continue

                //时长，误差Error
                const dError = Math.abs(duration - cDuration)
                if (dError == 0) {
                    score += 0.15
                    ++hits
                } else if (dError < 30 * 1000) {
                    score += 0.13
                }
                else if (dError < 45 * 1000) {
                    score += 0.1
                }
                else if (dError < 60 * 1000) {
                    score += 0.05
                }

                if (score < 0.65 && hits < 2) continue
                const vendor = getVendor(cPlatform)
                if (!vendor) continue
                const cDetail = await vendor.playDetail(cId, candidate)
                if (!Track.hasUrl(cDetail) && !ignoreUrl) continue
                const { url } = cDetail
                //歌词
                const cLyric = await vendor.lyric(candidate.id, candidate)
                const { lyric, trans: lyricTrans, roma: lyricRoma } = cLyric
                Object.assign(candidate, { url, lyric, lyricTrans, lyricRoma, isCandidate: true, score })
                result = candidate
                break
            }
            resolve(result)
        })
    }

}