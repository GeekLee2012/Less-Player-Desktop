//import analyze from 'rgbaster';
import CryptoJS from 'crypto-js';
import { pinyin } from 'pinyin-pro';
import { DEFAULT_COVER_BASE64 } from './Constants';


const tryCall = (call, fallbackValue) => {
    try {
        return call()
    } catch (error) {
        //Do Nothing
    }
    return fallbackValue
}

export const useIpcRenderer = () => {
    return tryCall(() => (electronAPI.ipcRenderer), null)
}

export const isMacOS = () => {
    return tryCall(() => (electronAPI.isMacOS), null)
}

export const isWinOS = () => {
    return tryCall(() => (electronAPI.isWinOS), null)
}

export const useUseCustomTrafficLight = () => {
    return tryCall(() => (electronAPI.useCustomTrafficLight), false)
}

export const isDevEnv = () => {
    return tryCall(() => (electronAPI.isDevEnv), null)
}

export const useMessagePort = () => {
    return tryCall(() => (electronAPI.messagePort), null)
}

export const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz'
export const ALPHABET_NUMS = ALPHABETS + '01234567890'

/** 随机字符串
 * @param src 限定组成元素的字符串，如：ABCDEFGHIJKLMNOPQRSTUVWSYZ
 * @param len 长度
 */
export const randomText = (src, len) => {
    let result = []
    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * (src.length - 1))
        result.push(src.charAt(index))
    }
    return result.join('')
}

/** 随机字符串: 只有大小写字母组成 */
export const randomTextWithinAlphabet = (len) => (randomText(ALPHABETS, len))

/** 随机字符串: 大小写字母和数字组成 */
export const randomTextWithinAlphabetNums = (len) => (randomText(ALPHABET_NUMS, len))

export const toTrimString = (value) => {
    value = (value === 0 ? '0' : value)
    return (value || '').toString().trim()
}

export const toLowerCaseTrimString = (value) => {
    return toTrimString(value).toLowerCase()
}

export const toUpperCaseTrimString = (value) => {
    return toTrimString(value).toLowerCase()
}

export const isBlank = (text) => {
    return toTrimString(text).length < 1
}

//TODO 处理空白无效字符
export const trimExtraChars = (text) => {
    return toTrimString(text).replace(/(\\n\\n)/g, '')
}

/*
export const useRgbaster = async (src, opts) => {
    return new Promise((resolve, reject) => {
        analyze(src, opts).then(result => {
            let recommandColor = '#000'
            if(!result || result.length < 1) {
                resolve(recommandColor)
                return
            }
            const { color } = result[0] //dominant color 主色
            const rgbs = color.split('(')[1].replace(')', '').split(',')
            const r = parseInt(rgbs[0]), g = parseInt(rgbs[1]), b = parseInt(rgbs[2])
            //recommandColor = (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000' : '#fff'
            recommandColor = (r * 0.213 + g * 0.715 + b * 0.072) > 255 / 2 ? '#000' : '#fff'
            resolve(recommandColor)
        })
    })
}
*/

//TODO 随机数不随机！
export const nextInt = (max) => {
    max = max || 1024
    const limit = max < 1024 ? 1024 : max
    return Math.floor(Math.random() * limit) % max
}

export const utf8Parse = (text) => {
    return CryptoJS.enc.Utf8.parse(text)
}

export const utf8Stringify = (wordArray) => {
    return CryptoJS.enc.Utf8.stringify(wordArray)
}

export const base64Stringify = (wordArray) => {
    if (!wordArray) return null
    if (typeof (wordArray) == 'string') wordArray = utf8Parse(wordArray)
    return CryptoJS.enc.Base64.stringify(wordArray)
}

export const base64Parse = (text) => {
    return text ? CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8) : null
}

export const hexStringify = (wordArray) => {
    return CryptoJS.enc.Hex.stringify(wordArray)
}

export const hexParse = (text) => {
    return CryptoJS.enc.Hex.parse(text)
}

export const hexDecode = (text) => {
    return text ? hexParse(text).toString() : null
}

export const md5 = (text) => {
    return text ? CryptoJS.MD5(text).toString() : null
}

export const hmacMd5 = (text, key) => {
    return text ? CryptoJS.HmacMD5(text, key).toString() : null
}

//参考: https://aaron-bird.github.io/2019/03/30/%E7%BC%93%E5%8A%A8%E5%87%BD%E6%95%B0(easing%20function)/
const easeInOutQuad = (currentTime, startValue, changeValue, duration) => {
    currentTime /= duration / 2
    if (currentTime < 1) return changeValue / 2 * currentTime * currentTime + startValue
    currentTime--
    return -changeValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue
}

//TODO 平滑算法，基本可行，但感觉有点呆！暂时先这样吧
export const smoothAnimation = (target, animationAlgoFn, start, dest, duration, step, updateAction, interruptAction) => {
    if (!target || !animationAlgoFn || !updateAction) return
    step = step || 5
    const distance = dest - start

    let current = 0, animationFrameId = 0
    const updateAnimation = () => {
        const needInterrupt = (interruptAction && interruptAction())
        if (current > duration || needInterrupt) {
            cancelAnimationFrame(animationFrameId)
            return
        }
        let updateValue = animationAlgoFn(current, start, distance, duration)
        if (target && typeof (updateAction) == 'function') updateAction(updateValue)
        current += step
        cancelAnimationFrame(animationFrameId)
        animationFrameId = requestAnimationFrame(updateAnimation)
    }
    updateAnimation()
}

//平滑滚动
export const smoothScroll = (target, dest, duration, step, interruptAction) => {
    smoothAnimation(target, easeInOutQuad, target.scrollTop, dest, duration, step, (value => target.scrollTop = value), interruptAction)
}

//平滑滚动 - 水平方向
export const smoothScrollHorizional = (target, dest, duration, step, interruptAction) => {
    smoothAnimation(target, easeInOutQuad, target.scrollLeft, dest, duration, step, (value => target.scrollLeft = value), interruptAction)
}

//限制数组总长度，超出部分会直接删除
export const trimArray = async (data, limit) => {
    limit = limit || 999
    if (data && data.length > limit) {
        const deleteCount = data.length - limit
        await data.splice(limit, deleteCount)
        return deleteCount
    }
    return 0
}

/** 支持格式:  
 * #EXTINF: [length], [title], [cover]  
 * [url]  
 * 注意：当[title]中有英文逗号[,]时，内容必须使用中文双引号[“”]包裹；  
 * 而[cover]不允许有英文逗号。
 */
export const parseM3uText = (text, mapFn) => {
    const result = { data: [] }
    try {
        //逐行解析
        const lines = toTrimString(text).split('\n')
        if (!lines) return result
        let title = null, url = null, length = null, cover = null
        for (var i = 0; i < lines.length; i++) {
            const line = toTrimString(lines[i])

            if (line.length < 1) return result
            if (line.startsWith('#EXTM3U')) continue
            if (line.startsWith('#EXTINF')) {
                const metaText = line.replace('#EXTINF:', '')
                const metaParts = metaText.split(',')
                const pLen = metaParts.length
                length = parseInt(metaParts[0])
                if (pLen > 2) {
                    cover = metaParts[pLen - 1].replace('“', '').replace('”', '').replace(/"/g, '')
                    title = ''
                    for (let j = 1; j < pLen - 1; j++) {
                        title += (metaParts[j] + ', ')
                    }
                } else {
                    title = metaParts[1]
                }
                title = toTrimString(title)
                if (title.endsWith(',')) title = toTrimString(title.substring(0, title.length - 1))
                if (title.startsWith('“') || title.startsWith('"')) title = toTrimString(title.substring(1))
                if (title.endsWith('”') || title.startsWith('"')) title = toTrimString(title.substring(0, title.length - 1))
            } else {
                url = line
            }
            if (url != null) {
                let item = {
                    title,
                    length,
                    cover,
                    url
                }
                if (mapFn && typeof (mapFn) == 'function') item = mapFn(item)
                result.data.push(item)
                //重置
                title = null
                url = null
                length = null
                cover = null
            }
        }
    } catch (error) {
        console.log(error)
    }
    return result
}

//解析.pls格式文件
export const parsePlsText = (text, mapFn) => {
    const result = { data: [] }
    try {
        //逐行解析
        const lines = toTrimString(text).split('\n')
        if (!lines) return result
        let title = null, url = null, length = null
        for (var i = 0; i < lines.length; i++) {
            const line = toTrimString(lines[i])

            if (line.length < 1) return result
            //[Playlist]，类似标签，直接忽略
            if (line.startsWith('[') && line.endsWith(']')) continue

            const index = line.indexOf('=')
            //不合法格式
            if (index == -1) continue
            //解析[key=value]
            const key = line.substring(0, index)
            const value = line.substring(index + 1)
            const lcKey = key.toLowerCase()
            if (lcKey.startsWith('numberofentries')) {
                Object.assign(result, { total: parseInt(value) })
            } else if (lcKey.startsWith('version')) {
                Object.assign(result, { version: value })
            } else if (lcKey.startsWith('file')) {
                url = value
            } else if (lcKey.startsWith('title')) {
                title = value
            } else if (lcKey.startsWith('length')) {
                length = parseInt(value)
            }
            //TODO 暂时先简单处理，不校验序号是否匹配
            if (url != null && title != null && length != null) {
                let item = {
                    title,
                    url,
                    length,
                    cover: null
                }
                if (mapFn && typeof (mapFn) == 'function') item = mapFn(item)
                result.data.push(item)
                //重置
                title = null
                url = null
                length = null
            }
        }
        return result
    } catch (error) {
        console.log(error)
    }
    return result
}


export const isChineseChar = (ch) => {
    return /[\u4e00-\u9fa5]/.test(ch)
}

export const isEnglishChar = (ch) => {
    return /[A-Za-z]/.test(ch)
}

export const firstCharOfPinyin = (ch) => {
    return pinyin(ch, { toneType: 'none' }).substring(0, 1)
}

export const coverDefault = (cover) => {
    return cover || DEFAULT_COVER_BASE64
}