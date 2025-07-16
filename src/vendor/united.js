import { toRaw } from 'vue';
import { Track } from "../common/Track";
import { 
    toTrimString, stringIncludesIgnoreCaseEscapeHtml, 
    stringEqualsIgnoreCaseEscapeHtml, trimTextWithinBrackets, 
    isDevEnv, tryCallDefault,
 } from "../common/Utils";
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

    static pretranformArtistName(name) {
        return toTrimString(name).replace('网络歌手', '')
            .replace('未知歌手', '')
            .replace('未知艺人', '')
            .replace('未知艺术家', '')
            .replace('群星', '')
            .replace('[Unknown Artist]', '')
            .replace('[Unknown]', '')
            .replace('Unknown Artist', '')
            .trim()
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
            .replace('[Unknown Artist]', '')
            .replace('[Unknown]', '')
            .replace('Unknown Artist', '')
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

    static getVendors(sortFn) {
        const { platforms } = usePlatformStore()
        const uPlatforms = (platforms('united') || [])
        if(sortFn && typeof sortFn == 'function') uPlatforms.sort(sortFn)
        return uPlatforms.map(item => (item.vendor))
    }

    static getVendor(code) {
        const vendors = (United.getVendors() || []).filter(item => (item && (item.CODE == code)))
        return Array.isArray(vendors) && vendors[0]
    }

    //简化Track元数据
    static simplifyMetadata(track) {
        const _track = { ...toRaw(track) }
        //移除非必要信息
        const excludeProps = ['url', 'lyric', 'lyricTrans', 'lyricRoma',
            'publishTime', 'score', 'isCandidate']
        excludeProps.forEach(prop => Reflect.deleteProperty(_track, prop))
        return _track
    }

    static mergeTrackResult(result, track) {
        if(!track) return result

        const { url, cover, lyric, lyricTrans, lyricRoma } = track
        if(!Track.hasUrl(result) && Track.hasUrl(track)) {
            Object.assign(result, { url })
        }
        if(!Track.hasCover(result, true) && Track.hasCover(track, true)) {
            Object.assign(result, { cover })
        }
        if(!Track.hasLyric(result) && Track.hasLyric(track)) {
            Object.assign(result, { lyric, lyricTrans, lyricRoma })
        }
        return result
    }

    //互惠互助、互通有无、移花接木、同舟共济 ~
    static transferTrack(track, options, interruptFn) {
        return new Promise(async (resolve, reject) => {
            const result = { ...track }

            const { platform: fromPlatform, title } = track
            const firstArtistName = United.pretranformArtistName(Track.firstArtistName(track))
            const _title = United.pretransformTitle(title)
            const tTitle = United.tranformTitle(_title, firstArtistName)
            const tArtistName = United.tranformArtistName(_title, firstArtistName)
            const keyword = `${tTitle} ${tArtistName}`

            //TODO 优先级策略
            const filteredVendors = United.getVendors((p1, p2) => (p2.weight - p1.weight))
                .filter(v => (v.CODE != fromPlatform))
            const fromVendor = United.getVendor(fromPlatform)
            if (fromVendor) filteredVendors.push(fromVendor)
            
            const _options = { }
            for (var i = 0; i < filteredVendors.length; i++) {
                if(tryCallDefault(interruptFn, track)) break
                
                const vendor = filteredVendors[i]
                if(!vendor) continue
                
                try {
                    //音源扩展点 - 可实现准确匹配，知道歌曲信息
                    if(vendor.transferTrack) {
                        const ttResult = await vendor.transferTrack(United.simplifyMetadata(track), options || _options)
                        Object.assign(result, { ...United.mergeTrackResult(result, ttResult) })
                    }
                } catch(error) {
                    console.log(error)
                }

                if(tryCallDefault(interruptFn, track)) break

                if (United.isMetedataCompleted(result)) break

                if(!options && Track.hasUrl(result) && !Track.hasCover(result)) {
                    Object.assign(_options, { isGetCover: true }) 
                } else if(!options && Track.hasUrl(result) && !Track.hasLyric(result)) {
                    Object.assign(_options, { isGetLyric: true }) 
                }
                
                if(!vendor.searchSongs) continue
                
                //音源扩展点 - 模糊（范围）匹配，只知道关键字，不知道歌曲信息
                let searchResult = null
                try {
                    searchResult = await vendor.searchSongs(keyword, options || _options)
                } catch(error) {
                    console.log(error)
                }
                if (!searchResult) continue
                
                if(tryCallDefault(interruptFn, track)) break

                const { data: candidates } = searchResult
                if (!candidates || candidates.length < 1) continue

                const ssResult = await United.matchTrack(
                    { ...track, tTitle, tArtistName }, 
                    candidates.slice(0, Math.min(candidates.length, 20)), 
                    options || _options, interruptFn)
                
                if(tryCallDefault(interruptFn, track)) break

                Object.assign(result, { ...United.mergeTrackResult(result, ssResult) })
                if (United.isMetedataCompleted(result)) break
            }
            resolve(result)
        })
    }

    static isMetedataCompleted(track) {
        return Track.hasUrl(track) 
            && Track.hasCover(track, true) 
            && Track.hasLyric(track)
    } 

    //TODO 匹配算法，后续再完善
    static matchTrack(track, candidates, options, interruptFn) {
        const ignore = {
            album: false,
            url: false,
            cover: true,
            lyric: false
        }
        const { isGetCover, isGetLyric } = options || { isGetCover: false, isGetLyric: false }
        if(isGetCover) Object.assign(ignore, { album: true, url: true, cover: false, lyric: true })
        if(isGetLyric) Object.assign(ignore, { album: true, url: true, lyric: false })
        
        return new Promise(async (resolve, reject) => {
            if(!track || !Array.isArray(candidates) || candidates.length < 1) {
                return resolve(null)
            }

            let result = null
            const { id, platform, title, artist, duration, tTitle, tArtistName } = track
            const albumName = United.tranformAlbum(Track.albumName(track)) || LESS_MAGIC_CODE
            
            for (var i = 0; i < candidates.length; i++) {
                if(tryCallDefault(interruptFn, track)) break

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
                    //1、本地歌曲：同一目录下，可能存在多首“同名”歌曲，如：青春纪念册.mp3、青春纪念册2.mp3
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
                //本地歌曲title格式：[名称]、[名称 - 歌手]、[歌手 - 名称]
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

                //当原歌曲并非这类版本时，候选歌曲不推荐：纯音乐、伴奏、DJ版等
                //名称也只是个约定，至于对应的音频内容是否正确，也无法判断
                //有不少伴奏、纯音乐、翻唱版、改编版、片段等，名称上并没有标明
                //所以整体上，匹配准确率也不高
                const notRecommendTitles = [
                    '伴奏', '(DJ', '(纯音', 
                    '轻音乐', '钢琴版', '翻自', 
                    '翻唱', '改编', '抖音', 
                    '片段', '铃声']
                for(let i = 0; i < notRecommendTitles.length; i++) {
                    const nrTitle = notRecommendTitles[i]
                    if(!_title.includes(nrTitle) && cTitle.includes(nrTitle)) {
                        score.title -= 20
                        break
                    }
                }
                
                if(tryCallDefault(interruptFn, track)) break

                //歌手
                if (artist && artist.length > 0 && cArtistName) {
                    for (var j = 0; j < artist.length; j++) {
                        const { name } = artist[j]
                        const _name = (name || LESS_MAGIC_CODE)
                        const _name1 = _name && _name.slice(0, -1)
                        const _name2 = trimTextWithinBrackets(_name)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name)
                            || stringIncludesIgnoreCaseEscapeHtml(_name, cAlbumName)
                            //兼容处理：名称 + 单个任意字符（数字、符号等） 
                            || stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name1)
                            || stringIncludesIgnoreCaseEscapeHtml(_name1, cArtistName)
                            //去掉括号内的全部内容
                            || stringIncludesIgnoreCaseEscapeHtml(trimTextWithinBrackets(cArtistName), _name2)
                            || stringIncludesIgnoreCaseEscapeHtml(_name2, trimTextWithinBrackets(cArtistName))
                        ) {
                            score.artist += 20
                            hit.artist = true
                            break
                        }
                    }
                } else if(cArtistName) {
                    //处理本地歌曲title格式：[名称 - 歌手]、[歌手 - 名称]
                    const _tArtists = [tArtistName, tTitle]
                    for(var j = 0; j < _tArtists.length; j++) {
                        const _name = (_tArtists[j] || LESS_MAGIC_CODE)
                        const _name1 = _name && _name.slice(0, -1)
                        const _name2 = trimTextWithinBrackets(_name)
                        if (stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name) 
                            || stringIncludesIgnoreCaseEscapeHtml(_name, cArtistName) 
                            //兼容处理：名称 + 单个任意字符（数字、符号等） 
                            || stringIncludesIgnoreCaseEscapeHtml(cArtistName, _name1)
                            || stringIncludesIgnoreCaseEscapeHtml(_name1, cArtistName)
                            //去掉括号内的全部内容
                            || stringIncludesIgnoreCaseEscapeHtml(trimTextWithinBrackets(cArtistName), _name2)
                            || stringIncludesIgnoreCaseEscapeHtml(_name2, trimTextWithinBrackets(cArtistName))
                        ) {
                            score.artist += 20
                            hit.artist = true
                            break
                        }
                    }
                }

                if(tryCallDefault(interruptFn, track)) break
                
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
                    //TODO 此处逻辑，当歌曲时长确实比较短时，匹配将会发生偏差
                    if(dError <= 30 * 1000) {
                        score.duration -= 15
                    } else if(dError <= 45 * 1000) {
                        score.duration -= 10
                    } else if(dError <= 60 * 1000) {
                        score.duration -= 5
                    } else {
                        score.duration = 0
                    }
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

                if(tryCallDefault(interruptFn, track)) break

                const evaluation = United.sumEvaluation(score, hit)
                //总评分是否达标
                if (!United.isEvaluationPass(evaluation)) continue

                if(tryCallDefault(interruptFn, track)) break

                Object.assign(candidate, { isCandidate: true })
                if(isDevEnv()) Object.assign(candidate, { score, hit, ...evaluation }) 
                
                const vendor = United.getVendor(cPlatform)
                if (!vendor) continue
                //URL
                if (!ignore.url) {
                    //平台若不支持获取歌曲URL，直接中断
                    if(!vendor.playDetail) break
                    const cDetail = await vendor.playDetail(cId, candidate)
                    if (!Track.hasUrl(cDetail)) continue

                    const { url } = cDetail
                    Object.assign(candidate, { url })
                }

                if(tryCallDefault(interruptFn, track)) break
                
                //歌词
                //若时长相同，且已有歌词，仍需重新获取，可能缺少翻译
                if(!ignore.lyric) {
                    //平台若不支持获取歌词，直接中断
                    if(!vendor.lyric) break
                    const cLyric = await vendor.lyric(candidate.id, candidate)
                    if (!cLyric) continue
                    const { lyric, trans: lyricTrans, roma: lyricRoma } = cLyric
                    if(!Lyric.hasData(lyric) && isGetLyric) continue
                    Object.assign(candidate, { lyric, lyricTrans, lyricRoma })    
                }

                if(tryCallDefault(interruptFn, track)) break

                //封面
                if(!ignore.cover && !Track.hasCover(candidate)) continue

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