import { Track } from "../common/Track";
import { toTrimString, stringIncludesIgnoreCaseEscapeHtml, 
    stringEqualsIgnoreCaseEscapeHtml, trimTextWithinBrackets, 
    isDevEnv} from "../common/Utils";
import { LESS_MAGIC_CODE } from "../common/Constants";
import { usePlatformStore } from "../renderer/store/platformStore";
import { Lyric } from "../common/Lyric";



/** 统一平台，协调处理公共业务 */
export class United {
    static CODE = 'united'

    //名称：预处理
    static pretransformTitle(title) {
        if(!title) return ''
        title = toTrimString(title)
            .replace(/（/g, '(')
            .replace(/）/g, ')')
        //兼容格式：歌曲名(Live)、歌曲名(Cover)等
        const keywords = ['Live', 'Cover', 'Clean', 'Explicit']
        keywords.forEach(keyword => {
            const reg1 = new RegExp(`（${keyword}）`, 'gi')
            const reg2 = new RegExp(`\\(${keyword}\\)`, 'gi')
            title = title.replace(reg1, '').replace(reg2, '').trim()
        })
        //兼容格式：歌曲名(电视剧《xxxxxx》)等
        let index = title.indexOf('(电视剧《')
        if(index < 0) index = title.indexOf('(网络剧《')
        if(index < 0) index = title.indexOf('(电影《')
        if(index < 0) index = title.indexOf('(动漫《')
        if(index > 0) { 
            title = title.substring(0, index)
        }  //兼容格式：歌曲名(xxx主题曲)、歌曲名(xxx版)等
        else if(/.+\(.+主题曲\)$/.test(title) 
            || /.+\(.+版\)$/.test(title)
            || /.+\(.+插曲\)$/.test(title)
            || /.+\(.+片头曲\)$/.test(title)
            || /.+\(.+片尾曲\)$/.test(title))  {
            index = title.indexOf('(')
            title = title.substring(0, index)
        }
        return title
    }

    //名称：再次处理
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
            .trim()
    }

    //专辑
    static tranformAlbum(album) {
        album = toTrimString(album)
        //格式：《专辑名称》
        if(album.startsWith('《') && album.endsWith('》')) {
            album = album.substring(1, album.length - 1)
        }
        return album
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
            const _title = United.pretransformTitle(title)
            const tTitle = United.tranformTitle(_title, firstArtistName)
            const tArtistName = United.tranformArtistName(_title, firstArtistName)
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
        const ignore = {
            album: false,
            url: false,
            cover: true,
            lyric: true
        }
        if(options) {
            const { isGetCover, isGetLyric } = options
            if(isGetCover) Object.assign(ignore, { album: true, url: true, cover: false})
            if(isGetLyric) Object.assign(ignore, { album: true, url: true, lyric: false})
        }
        return new Promise(async (resolve, reject) => {
            let result = null
            const { id, platform, title, artist, duration, tTitle, tArtistName } = track
            const albumName = United.tranformAlbum(Track.albumName(track)) || LESS_MAGIC_CODE
            
            for (var i = 0; i < candidates.length; i++) {
                const candidate = candidates[i]
                const { id: cId, title: cTitle,
                    platform: cPlatform, duration: cDuration } = candidate
                //跳过自身
                if (id == cId && platform == cPlatform) continue
                //是否有封面
                if(!ignore.cover && !Track.hasCover(candidate)) continue

                //开始评估、匹配
                const score = { base: 5, title: 0, artist: 0, album: 0, duration: 0, lyric: 0 }
                const hit =  { title: false, artist: false, album: false, duration: false, lyric: false }

                const cArtistName = Track.artistName(candidate)
                const cAlbumName = United.tranformAlbum(Track.albumName(candidate))

                //歌曲名称
                const _title = (title || LESS_MAGIC_CODE)
                //歌曲title格式：[名称]、[名称 - 歌手]、[歌手 - 名称]
                const isSimilar = stringIncludesIgnoreCaseEscapeHtml(cTitle, _title)
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tTitle)
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tArtistName)
                    //兼容处理：歌曲/歌手名称 + 单个任意字符（数字、符号等），例如：
                    //1、同一本地目录下，可能存在多首“同名”歌曲，如：青春纪念册.mp3、青春纪念册2.mp3
                    //2、歌手名称：S.H.E、S.H.E.
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, title && title.slice(0, -1))
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tTitle && tTitle.slice(0, -1))
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, tArtistName && tArtistName.slice(0, -1))
                    //去掉括号内的全部内容
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(_title))
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(tTitle))
                    || stringIncludesIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(tArtistName))
                
                //歌曲名称没有任何相同
                if (!isSimilar) continue
                score.title += 25

                //在线歌曲title格式，直接比较
                //本地歌曲title格式：[名称 - 歌手]、[歌手 - 名称]
                if (stringEqualsIgnoreCaseEscapeHtml(cTitle, _title) 
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, tTitle) 
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, tArtistName)
                    //兼容格式：名称 + 单个任意字符（数字、符号等） 
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, title && title.slice(0, -1)) 
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, tTitle && tTitle.slice(0, -1)) 
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, tArtistName && tArtistName.slice(0, -1))
                    //去掉括号内的全部内容
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(_title))
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(tTitle))
                    || stringEqualsIgnoreCaseEscapeHtml(cTitle, trimTextWithinBrackets(tArtistName))) {
                    score.title += 5
                    hit.title = true
                }

                //歌曲候选版本不推荐（当原歌曲非这些版本时）：纯音乐、伴奏、DJ版
                const notRecommendTitles = ['伴奏', '(DJ版)', '纯音乐']
                for(let i = 0; i < notRecommendTitles.length; i++) {
                    const nrTitle = notRecommendTitles[i]
                    if(!_title.includes(nrTitle) && cTitle.includes(nrTitle)) {
                        score.title -= 20
                        break
                    }
                }
                

                //歌手
                if (artist && artist.length > 0 && cArtistName) {
                    for (var j = 0; j < artist.length; j++) {
                        const { name } = artist[j]
                        const _name = (name || LESS_MAGIC_CODE)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name)
                            //兼容处理：名称 + 单个任意字符（数字、符号等） 
                            || stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name && _name.slice(0, -1))
                            //去掉括号内的全部内容
                            || stringIncludesIgnoreCaseEscapeHtml(trimTextWithinBrackets(cArtistName), trimTextWithinBrackets(_name))) {
                            score.artist += 20
                            hit.artist = true
                            break
                        }
                    }
                } else if(cArtistName) {
                    //处理本地歌曲title格式：[名称 - 歌手]，或[歌手 - 名称]
                    const _tArtists = [tArtistName, tTitle]
                    for(var j = 0; j < _tArtists.length; j++) {
                        const _name = (_tArtists[j] || LESS_MAGIC_CODE)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name) 
                            //兼容处理：名称 + 单个任意字符（数字、符号等） 
                            || stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name && _name.slice(0, -1))
                            //去掉括号内的全部内容
                            || stringIncludesIgnoreCaseEscapeHtml(trimTextWithinBrackets(cArtistName), trimTextWithinBrackets(_name))) {
                            score.artist += 20
                            hit.artist = true
                            break
                        }
                    }
                }

                 //同歌曲名、同歌手
                if(hit.title && hit.artist) score.base += 10

                //专辑
                if (ignore.album || stringEqualsIgnoreCaseEscapeHtml(albumName, cAlbumName)
                    || albumName == LESS_MAGIC_CODE) {
                    score.album += 20
                    hit.album = true
                } else if (stringIncludesIgnoreCaseEscapeHtml(albumName, cAlbumName)) {
                    score.album += 15
                } else {
                    score.album = 0
                }

                //同歌曲名、同专辑名，但歌手不同，大概率为不同歌曲
                //翻唱版本，歌手一般不同，尽可能听原唱
                if (!hit.artist && (!hit.title || !hit.album)) continue

                //时长，误差Error
                const dError = Math.abs(duration - cDuration)
                if(duration <= 0) {
                    score.duration = 0
                } else if (dError == 0) {
                    score.duration += 15
                    hit.duration = true
                } else if (dError < 5 * 1000) {
                    score.duration += 13
                } else if (dError < 10 * 1000) {
                    score.duration += 10
                } else if (dError < 20 * 1000) {
                    score.duration -= 5
                } else if (dError < 30 * 1000) {
                    score.duration -= 10
                } else {
                    score.duration -= 15
                }

                const evaluation = United.sumEvaluation(score, hit)
                //总评分是否达标
                if (!United.isEvaluationPass(evaluation)) continue
                Object.assign(candidate, { isCandidate: true })
                if(isDevEnv()) Object.assign(candidate, { score, hit, ...evaluation }) 
                
                const vendor = United.getVendor(cPlatform)
                if (!vendor) continue
                //URL
                if (!ignore.url) {
                    if(!vendor.playDetail) continue
                    const cDetail = await vendor.playDetail(cId, candidate)
                    if (!Track.hasUrl(cDetail)) continue

                    const { url } = cDetail
                    Object.assign(candidate, { url })
                }

                //歌词
                if(!ignore.lyric && !vendor.lyric) continue
                const cLyric = await vendor.lyric(candidate.id, candidate)
                if (!cLyric) continue
                const { lyric, trans: lyricTrans, roma: lyricRoma } = cLyric
                if(!ignore.lyric && !Lyric.hasData(lyric)) continue
                Object.assign(candidate, { lyric, lyricTrans, lyricRoma })
                
                result = candidate
                break
            }
            resolve(result)
        })
    }

    static sumEvaluation(score, hit) {
        const totalScore = Object.values(score).reduce((v1, v2) => (v1 + v2), 0)
        let totalHit = 0
        Object.values(hit).forEach(value => totalHit += (value ? 1 : 0))
        return { totalScore, totalHit }
    }

    static isEvaluationPass(evaluation) {
        if(!evaluation) return false
        const { totalScore, totalHit } = evaluation
        return totalScore >= 60 && totalHit >= 2
    }
}