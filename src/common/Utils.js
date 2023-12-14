//import analyze from 'rgbaster';
import CryptoJS from 'crypto-js';
import forge from "node-forge";
import JSEncrypt from 'jsencrypt';
import { pinyin } from 'pinyin-pro';
import { DEFAULT_COVER_BASE64 } from './Constants';


export const tryCall = (fn, params, onSuccess, onError) => {
    try {
        if(fn && (typeof fn == 'function')) {
            const result = fn(params)
            if (onSuccess && (typeof onSuccess == 'function')) {
                return onSuccess(result)
            }
            return result
        }
    } catch (error) {
        console.log(error)
        if (onError && (typeof onError == 'function')) return onError(params)
    }
}

export const tryCallDefault = (fn, params, defaultValue) => {
    return tryCall(fn, params, result => (result), (params) => (defaultValue))
}

export const useIpcRenderer = () => {
    return tryCallDefault(() => (electronAPI.ipcRenderer))
}

export const useStartDrag = () => {
    return tryCallDefault(() => (electronAPI.startDrag))
}

export const isMacOS = () => {
    return tryCallDefault(() => (electronAPI.isMacOS))
}

export const isWinOS = () => {
    return tryCallDefault(() => (electronAPI.isWinOS))
}

export const useUseCustomTrafficLight = () => {
    return tryCallDefault(() => (electronAPI.useCustomTrafficLight))
}

export const isDevEnv = () => {
    return tryCallDefault(() => (electronAPI.isDevEnv))
}

export const useDownloadsPath = () => {
    return tryCallDefault(() => (electronAPI.downloadsPath))
}

export const useAudioExts = () => {
    return tryCallDefault(() => (electronAPI.AUDIO_EXTS))
}

export const useExtraAudioExts = () => {
    return tryCallDefault(() => (electronAPI.EXTRA_AUDIO_EXTS))
}

export const useMessagePort = () => {
    return tryCallDefault(() => (electronAPI.messagePort))
}

export const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz'
export const ALPHABET_NUMS = `${ALPHABETS}01234567890`

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
    return toTrimString(value).toUpperCase()
}

export const readLines = (text, seperator) => {
    if(isBlank(text)) return []
    seperator = seperator || '\n'
    return toTrimString(text).split(seperator)
}

export const stringEquals = (value1, value2) => {
    if(!value1 || !value2) return false
    return toTrimString(value1) === toTrimString(value2)
}

export const stringEqualsIgnoreCase = (value1, value2) => {
    if(!value1 || !value2) return false
    return toLowerCaseTrimString(value1) === toLowerCaseTrimString(value2)
}

export const stringEqualsEscapeHtml = (value1, value2) => {
    if(!value1 || !value2) return false
    const _value1 = escapeHtml(toTrimString(value1))
    const _value2 = escapeHtml(toTrimString(value2))
    return _value1 === _value2
}

export const stringEqualsIgnoreCaseEscapeHtml = (value1, value2) => {
    if(!value1 || !value2) return false
    const _value1 = escapeHtml(toLowerCaseTrimString(value1))
    const _value2 = escapeHtml(toLowerCaseTrimString(value2))
    return _value1 === _value2
}

export const stringIncludesIgnoreCaseEscapeHtml = (value1, value2) => {
    if(!value1 || !value2) return false
    const _value1 = escapeHtml(toLowerCaseTrimString(value1))
    const _value2 = escapeHtml(toLowerCaseTrimString(value2))
    return _value1.includes(_value2)
}

export const isBlank = (text) => {
    return toTrimString(text).length < 1
}

//TODO 处理空白无效字符
export const trimExtraChars = (text) => {
    return toTrimString(text).replace(/(\\n\\n)/g, '')
}

//去掉HTML标签、转义实体等
export const escapeHtml = (text) => {
    return toTrimString(text).replace(/<[^>]+>/g, '').trim()
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
    max = tryCallDefault(parseInt, max, 1024)
    const randomLimit = parseInt(Math.random() * 1024 + 66)
    const limit = Math.max(max, randomLimit)
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
    if (typeof wordArray == 'string') wordArray = utf8Parse(wordArray)
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

export const sha1 = (text) => {
    return text ? CryptoJS.SHA1(text).toString() : null
}

export const sha256 = (text) => {
    return text ? CryptoJS.SHA256(text).toString() : null
}

export const sha512 = (text) => {
    return text ? CryptoJS.SHA512(text).toString() : null
}

export const rsaEncrypt = (src, publicKey, modulus) => {
    src = toTrimString(src)
    const m = new forge.jsbn.BigInteger(modulus, 16)
    const k = new forge.jsbn.BigInteger(publicKey, 16)
    const s = new forge.jsbn.BigInteger(forge.util.bytesToHex(src), 16)

    return s.modPow(k, m).toString(16).padStart(256, '0')
}

/*
export const rsaEncryptDefault = (src, publicKey) => {
    const publicObj = forge.pki.publicKeyFromPem(publicKey)
    const bytes = publicObj.encrypt(src)
    //转换成 bytes 对象之后输出不同类型的结果
    const encrypted = forge.util.encode64(bytes)
    return encrypted
}
*/

export const rsaEncryptDefault = (src, publicKey) => {
    const encrypt = new JSEncrypt()
    encrypt.setPublicKey(publicKey)
    return encrypt.encrypt(src)
}

const toCryptoMode = (mode) => {
    if(!mode) return CryptoJS.mode.CBC
    if(typeof mode !== 'string') return mode
    mode = toLowerCaseTrimString(mode)
    if(mode.endsWith('-cbc') || mode === 'cbc') return CryptoJS.mode.CBC
    if(mode.endsWith('-cfb') || mode === 'cfb') return CryptoJS.mode.CFB
    if(mode.endsWith('-ecb') || mode === 'ecb') return CryptoJS.mode.ECB
    if(mode.endsWith('-ctr') || mode === 'ctr') return CryptoJS.mode.CTR
    if(mode.endsWith('-ofb') || mode === 'ofb') return CryptoJS.mode.OFB
    return CryptoJS.mode.CBC
}

const toCryptoPadding = (padding) => {
    if(!padding) return CryptoJS.pad.Pkcs7
    if(typeof padding !== 'string') return padding
    padding = toLowerCaseTrimString(padding)
    if(padding === 'pkcs7') return CryptoJS.pad.Pkcs7
    if(padding === 'nopadding') return CryptoJS.pad.NoPadding
    if(padding === 'ansix923') return CryptoJS.pad.AnsiX923
    if(padding === 'iso10126') return CryptoJS.pad.Iso10126
    if(padding === 'iso97971') return CryptoJS.pad.Iso97971
    if(padding === 'zeropadding') return CryptoJS.pad.ZeroPadding
    return CryptoJS.pad.Pkcs7
}

export const aesEncrypt = (src, mode, key, iv, padding) => {
    src = utf8Parse(src)
    mode = toCryptoMode(mode)
    key = utf8Parse(key)
    iv = utf8Parse(iv)
    padding = toCryptoPadding(padding)
    const params = { mode, iv }
    if(padding) Object.assign(params, { padding})
    return CryptoJS.AES.encrypt(src, key, params)
}

export const aesEncryptDefault = (src, mode, key, iv, padding) => {
    return aesEncrypt(src, mode, key, iv, padding).toString()
}

export const aesEncryptHexText = (src, mode, key, iv, padding) => {
    const buffer = aesEncrypt(src, mode, key, iv, padding)
    return hexStringify(buffer.ciphertext)
}

export const aesDecryptText = (src, mode, secKey, iv, padding) => {
    src = base64Stringify(hexParse(src))
    mode = toCryptoMode(mode)
    secKey = utf8Parse(secKey)
    iv = utf8Parse(iv)
    padding = toCryptoPadding(padding) 
    const buffer = CryptoJS.AES.decrypt(src, secKey, { mode, iv, padding })
    return buffer.toString()
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
    if(typeof animationAlgoFn != 'function') return
    step = step || 5
    const distance = dest - start

    let current = 0, animationFrameId = 0
    const updateAnimation = () => {
        const needInterrupt = (interruptAction && interruptAction())
        if (current > duration || needInterrupt) {
            return cancelAnimationFrame(animationFrameId)
        }
        let updateValue = animationAlgoFn(current, start, distance, duration)
        if (target && typeof updateAction == 'function') updateAction(updateValue)
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
                if (mapFn && (typeof mapFn == 'function')) item = mapFn(item)
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
                if (mapFn && (typeof mapFn == 'function')) item = mapFn(item)
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

export const transformUrl = (url, protocal) => {
    url = toTrimString(url)
    protocal = protocal || 'https'
    if(url.includes('://')) return url
    return `${protocal}://${url}`.replace(':////', '://')
  }