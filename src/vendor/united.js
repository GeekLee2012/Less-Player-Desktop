import { Track } from "../common/Track";
import { toTrimString, stringIncludesIgnoreCaseEscapeHtml, stringEqualsIgnoreCaseEscapeHtml } from "../common/Utils";
import { LESS_MAGIC_CODE } from "../common/Constants";
import { usePlatformStore } from "../renderer/store/platformStore";
import { Lyric } from "../common/Lyric";



/** 统一平台，协调处理公共业务 */
export class United {
    static CODE = 'united'

    static pretransformTitle(title) {
        if(!title) return ''
        const keywords = ['Live', 'Cover']
        keywords.forEach(keyword => {
          const reg1 = new RegExp(`（${keyword}）`, 'gi')
          const reg2 = new RegExp(`\\(${keyword}\\)`, 'gi')
          title = title.replace(reg1, '')
            .replace(reg2, '')
            .trim()
        })
        return title
      }

    //名称
    static tranformTitle(title, artistName) {
        let tTitle = toTrimString(title)
        const tArtistName = toTrimString(artistName) || LESS_MAGIC_CODE
        tTitle = tTitle.replace(tArtistName, '')
        const index = tTitle.lastIndexOf('-')
        if(index > -1) tTitle = tTitle.slice(0, index)
        return toTrimString(tTitle)
    }

    //歌手
    static tranformArtistName(title, name) {
        let tName = toTrimString(name)
        const index = title.lastIndexOf('-')
        if(!tName && index > -1) tName = toTrimString(title.slice(index + 1))
        return tName.replace('网络歌手', '')
            .replace('未知歌手', '')
            .replace('未知艺人', '')
            .replace('未知艺术家', '')
            .replace('群星', '')
    }

    static getVendors() {
        const { platforms } = usePlatformStore()
        const _platforms = platforms('united') || []
        const vendors = []
        for(var i = 0; i < _platforms.length; i++) vendors.push(_platforms[i].vendor)
        return vendors
    }

    static getVendor(code) {
        const vendors = United.getVendors()
        for(var i = 0; i < vendors.length; i++) {
            if(vendors[i].CODE == code) return vendors[i]
        }
        return null
    }

    //互惠互助、互通有无、移花接木？奏是介些说法啦 ~
    static transferTrack(track, options) {
        return new Promise(async (resolve, reject) => {
            let result = null
            const { platform: fromPlatform, title } = track
            const firstArtistName = Track.firstArtistName(track)
            const tTitle = United.tranformTitle(United.pretransformTitle(title), firstArtistName)
            const tArtistName = United.tranformArtistName(title, firstArtistName)
            const keyword = `${tTitle} ${tArtistName}`

            const filteredVendors = United.getVendors().filter(v => (v.CODE != fromPlatform))
            const fromVendor = United.getVendor(fromPlatform)
            if (fromVendor) filteredVendors.push(fromVendor)

            for (var i = 0; i < filteredVendors.length; i++) {
                const vendor = filteredVendors[i]
                if(!vendor) continue
                //if (vendor.CODE == fromPlatform || vendor.CODE == DouBan.CODE) continue
                const searchResult = await vendor.searchSongs(keyword)
                if (!searchResult) continue
                const { data: candidates } = searchResult
                if (!candidates || candidates.length < 1) continue
                result = await United.matchFromCandidates({ ...track, tTitle, tArtistName }, candidates.slice(0, Math.min(candidates.length, 20)), options)
                if (result) break
            }
            resolve(result)
        })
    }

    //TODO 匹配算法，后续再完善
    static matchFromCandidates(track, candidates, options) {
        let ignoreAlbum = false, ignoreUrl = false
        let ignoreCover = true, ignoreLyric = true
        if(options) {
            const { isGetCover, isGetLyric } = options
            if(isGetCover) {
                ignoreAlbum = true
                ignoreUrl = true
                ignoreCover = false
            }
            if(isGetLyric) {
                ignoreAlbum = true
                ignoreUrl = true
                ignoreLyric = false
            }
        }
        return new Promise(async (resolve, reject) => {
            let result = null
            const { id, platform, title, artist, duration, tTitle, tArtistName } = track
            const albumName = Track.albumName(track) || LESS_MAGIC_CODE
            for (var i = 0; i < candidates.length; i++) {
                const candidate = candidates[i]
                const { id: cId, title: cTitle,
                    platform: cPlatform, duration: cDuration } = candidate
                //跳过自身
                if (id == cId && platform == cPlatform) continue
                if(!ignoreCover && !Track.hasCover(candidate)) continue

                //开始评估、匹配
                const cArtistName = Track.artistName(candidate)
                const cAlbumName = Track.albumName(candidate)
                let score = 0.05, hits = 0
                //歌曲名称
                const _title = (title || LESS_MAGIC_CODE)
                //title格式：[名称], [名称 - 歌手], [歌手 - 名称]
                /*
                const isSimilar = cTitle.toLowerCase().includes(_title.toLowerCase()) 
                    || cTitle.toLowerCase().includes(tTitle.toLowerCase()) 
                    || cTitle.toLowerCase().includes(tArtistName.toLowerCase())
                */
                const isSimilar = stringIncludesIgnoreCaseEscapeHtml(cTitle, _title)
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tTitle)
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tArtistName)
                //歌曲名称没有任何相同
                if (!isSimilar) continue
                score += 0.25
                //在线歌曲title格式，直接比较
                //本地歌曲title格式：[名称 - 歌手]，或[歌手 - 名称]
                /*
                if (title == cTitle || tTitle == cTitle || tArtistName == cTitle) {
                    score += 0.05
                    ++hits
                }
                */
                if (stringEqualsIgnoreCaseEscapeHtml(title, cTitle) 
                    || stringEqualsIgnoreCaseEscapeHtml(tTitle, cTitle) 
                    || stringEqualsIgnoreCaseEscapeHtml(tArtistName, cTitle)) {
                    score += 0.05
                    ++hits
                }
                

                //歌手
                let isArtistMissed = true //未命中歌手
                if (artist && artist.length > 0 && cArtistName) {
                    for (var j = 0; j < artist.length; j++) {
                        const { name } = artist[j]
                        const _name = (name || LESS_MAGIC_CODE)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name)) {
                            score += 0.2
                            isArtistMissed = false
                            ++hits
                            break
                        }
                    }
                } else if(cArtistName) {
                    //处理本地歌曲title格式：[名称 - 歌手]，或[歌手 - 名称]
                    const _tArtists = [tArtistName, tTitle]
                    for(var j = 0; j < _tArtists.length; j++) {
                        const _name = (_tArtists[j] || LESS_MAGIC_CODE)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name)) {
                            score += 0.2
                            isArtistMissed = false
                            ++hits
                            break
                        }
                    }
                }
                //专辑
                if (ignoreAlbum || stringIncludesIgnoreCaseEscapeHtml(albumName, cAlbumName)
                    || albumName == LESS_MAGIC_CODE) {
                    score += 0.2
                    ++hits
                } else if (stringIncludesIgnoreCaseEscapeHtml(albumName, cAlbumName)) {
                    score += 0.15
                }

                //同歌曲名、同专辑名、不同歌手，大概率为不同歌曲
                //不同歌手，也算了，还是听坚持原唱
                if (hits <= 2 && isArtistMissed) continue

                //时长，误差Error
                const dError = Math.abs(duration - cDuration)
                if (dError == 0) {
                    score += 0.15
                    ++hits
                } else if (dError < 5 * 1000) {
                    score += 0.13
                } else if (dError < 10 * 1000) {
                    score += 0.1
                } else if (dError < 20 * 1000) {
                    score -= 0.05
                } else if (dError < 30 * 1000) {
                    score -= 0.1
                } else {
                    score -= 0.15
                }

                if (score < 0.6 || hits < 2) continue
                Object.assign(candidate, { isCandidate: true, score })
                //result = candidate
                const vendor = United.getVendor(cPlatform)
                if (!vendor) continue
                if (!ignoreUrl) {
                    const cDetail = await vendor.playDetail(cId, candidate)
                    if (!Track.hasUrl(cDetail)) continue
                    const { url } = cDetail
                    Object.assign(candidate, { url })
                }
                //歌词
                const cLyric = await vendor.lyric(candidate.id, candidate)
                if (!cLyric) continue
                const { lyric, trans: lyricTrans, roma: lyricRoma } = cLyric
                if(!ignoreLyric && !Lyric.hasData(lyric)) continue
                Object.assign(candidate, { lyric, lyricTrans, lyricRoma })
                result = candidate
                break
            }
            resolve(result)
        })
    }

}