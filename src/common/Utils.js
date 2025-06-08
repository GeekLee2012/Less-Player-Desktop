//import analyze from 'rgbaster';
import CryptoJS from 'crypto-js';
import forge from "node-forge";
import JSEncrypt from 'jsencrypt';
import { pinyin } from 'pinyin-pro';
import { FILE_PREFIX, DEFAULT_COVER_BASE64, FILE_SCHEME, LESS_MAGIC_CODE } from './Constants';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import ColorThief from '../../node_modules/colorthief/dist/color-thief.mjs';




/************ 函数调用 ************/
export const tryCall = (fn, params, onSuccess, onError) => {
    try {
        if(fn && (typeof fn == 'function')) {
            const result = fn(params)
            if (onSuccess && (typeof onSuccess == 'function')) return onSuccess(result)
            return result
        }
    } catch (error) {
        console.log(error)
        if (onError && (typeof onError == 'function')) return onError(params)
    }
}

export const tryCallOnObject = (fn, obj, params, onSuccess, onError) => {
    try {
        if(fn && obj && (typeof obj == 'object') && (typeof fn == 'function')) {
            const result = fn.call(obj, params)
            if (onSuccess && (typeof onSuccess == 'function'))  return onSuccess(result)
            return result
        }
    } catch (error) {
        console.log(error)
        if (onError && (typeof onError == 'function')) return onError(params)
    }
}

export const tryCallDefault = (fn, params, defaultValue) => {
    return tryCall(fn, params, result => (result), (params) => (defaultValue)) 
        || defaultValue
}


/************ 从主进程获取到的数据 ************/
export const useIpcRenderer = () => {
    return tryCallDefault(() => (electronAPI.ipcRenderer))
}

export const isIpcRendererSupported = () => {
    const ipcRenderer = useIpcRenderer()
    return ipcRenderer ? true : false
}

export const onIpcRendererEvent = (channel, handler) => {
    const ipcRenderer = useIpcRenderer()
    if(!ipcRenderer) return 
    if(!handler || typeof handler != 'function') return
    ipcRenderer.on(channel, handler)
}

export const onIpcRendererEvents = (registration) => {
    const ipcRenderer = useIpcRenderer()
    if(!ipcRenderer) return
    if(!registration || typeof registration != 'object') {
        throw new Error('parameter type error: not a object')
    }
    Object.entries(registration).forEach(([channel, handler]) => {
        onIpcRendererEvent(channel, handler)
    })
}

export const ipcRendererSend = (channel, data, options) => {
    const ipcRenderer = useIpcRenderer()
    if(!ipcRenderer) return 
    ipcRenderer.send(channel, data, options)
}

export const ipcRendererInvoke = async (channel, data, options) => {
    const ipcRenderer = useIpcRenderer()
    if(!ipcRenderer) return 
    return ipcRenderer.invoke(channel, data, options)
}

export const isNetOnline = async () => {
    return await ipcRendererInvoke('app-netOnline')
}

export const useStartDrag = () => {
    return tryCallDefault(() => (electronAPI.startDrag))
}

export const useWebZoom = () => {
    return tryCallDefault(() => (electronAPI.webZoom))
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
    return tryCallDefault(() => (electronAPI.DOWNLOADS_PATH))
}

export const useAudioExts = () => {
    return tryCallDefault(() => (electronAPI.AUDIO_EXTS))
}

export const useExtraAudioExts = () => {
    return tryCallDefault(() => (electronAPI.EXTRA_AUDIO_EXTS))
}

export const useVideoExts = () => {
    return tryCallDefault(() => (electronAPI.VIDEO_EXTS))
}

export const useVideoCollectionExts = () => {
    return tryCallDefault(() => (electronAPI.VIDEO_COLLECTION_EXTS))
}

export const useImageExts = () => {
    return tryCallDefault(() => (electronAPI.IMAGE_EXTS))
}

export const useMessagePort = () => {
    return tryCallDefault(() => (electronAPI.messagePort))
}

export const useGitRepository = () => {
    return tryCallDefault(() => (electronAPI.GitRepository))
}

export const useTrayAction = () => {
    return tryCallDefault(() => (electronAPI.TrayAction))
}

export const createMpv = (options, mpvArgs) => {
    return tryCallDefault(() => (electronAPI.createMpv(options, mpvArgs)))
}


/************ 字符串 ************/
export const ALPHABET_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWSYZ'
export const ALPHABET_LOWERCASE = ALPHABET_UPPERCASE.toLowerCase()
export const ALPHABETS = `${ALPHABET_UPPERCASE}${ALPHABET_LOWERCASE}`
export const NUMS = '0123456789'
export const ALPHABET_NUMS = `${ALPHABETS}${NUMS}0`
export const ALPHABET_FILTER = `#${ALPHABET_UPPERCASE}%`

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
    return toTrimString(value1) == toTrimString(value2)
}

export const stringPrefixEquals = (value1, value2, prefixLength) => {
    if(!value1 || !value2) return false
    return toTrimString(value1).substring(0, prefixLength) 
        == toTrimString(value2).substring(0, prefixLength)
}

export const stringEqualsIgnoreCase = (value1, value2) => {
    if(!value1 || !value2) return false
    return toLowerCaseTrimString(value1) == toLowerCaseTrimString(value2)
}

export const stringEqualsEscapeHtml = (value1, value2) => {
    if(!value1 || !value2) return false
    const _value1 = escapeHtml(toTrimString(value1))
    const _value2 = escapeHtml(toTrimString(value2))
    return _value1 == _value2
}

export const stringEqualsIgnoreCaseEscapeHtml = (value1, value2) => {
    if(!value1 || !value2) return false
    const _value1 = escapeHtml(toLowerCaseTrimString(value1))
    const _value2 = escapeHtml(toLowerCaseTrimString(value2))
    return _value1 == _value2
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

export const textDefault = (text, defaultText) => {
    return toTrimString(text) || toTrimString(defaultText)
}

//TODO 处理空白无效字符
export const trimExtraChars = (text) => {
    return toTrimString(text).replace(/(\\n\\n)/g, '')
}

//去掉HTML标签、转义实体等
export const escapeHtml = (text) => {
    return toTrimString(text).replace(/<[^>]+>/g, '').trim()
}

export const encodeURL = (text) => {
    if(typeof text == 'object') return text

    const _text = toTrimString(text)
    //在线URL一般无需额外处理
    if(_text.startsWith('http') || _text.startsWith('blob:http')) return _text
    //本地URL
    return _text.replace(/#/g, '%23')
        .replace(/\?/g, '%3F').trim()
}


//去掉括号内的全部内容
export const trimTextWithinBrackets = (text) => {
    text = toTrimString(text)
        .replace(/（/g, '(')
        .replace(/）/g, ')')
    if(isBlank(text)) return text
    const index = text.indexOf('(')
    return text.substring(0, index)
}

export const readProperties = (text, seperator) => {
    const lines = readLines(text, seperator)
    if(lines.length < 1) return 
    try {
        const props = {}
        lines.forEach(line => {
            if(isBlank(line)) return
            const index = line.indexOf('=')
            if(index < 0) return
            const key = toTrimString(line.substring(0, index))
            const value = (line.length - 1) >= index ? toTrimString(line.substring(index + 1)) : ''
            props[key] = value
        })
        return props
    } catch(error) {
        console.log(error)
    }
}


/************ 加解密 ************/
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
    return Math.floor(Math.random() * max) % max
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

export const aesDecryptDefault = (src, mode, secKey, iv, padding) => {
    src = base64Stringify(hexParse(src))
    mode = toCryptoMode(mode)
    secKey = utf8Parse(secKey)
    iv = utf8Parse(iv)
    padding = toCryptoPadding(padding) 
    const buffer = CryptoJS.AES.decrypt(src, secKey, { mode, iv, padding })
    return buffer.toString()
}

const aesEncryptSimple = (src, key) => {
    return CryptoJS.AES.encrypt(src, key).toString()
}

const aesDecryptSimple = (src, key) => {
    return CryptoJS.AES.decrypt(src, key).toString(CryptoJS.enc.Utf8)
}

export const encodeLess = (text, key) => {
    return aesEncryptSimple(text, (key || base64Stringify(LESS_MAGIC_CODE)))
}

export const decodeLess = (text, key) => {
    return aesDecryptSimple(text, (key || base64Stringify(LESS_MAGIC_CODE)))
}


/************ 平滑滚动 ************/
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
        if (current > duration || needInterrupt) return cancelAnimationFrame(animationFrameId)
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


/************ 文件处理 ************/
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

const detectVideoPlatform = (url) => {
    return url && url.startsWith('http') ? 'free-video' : 'local'
}

/** 解析levc格式文件
 * 目前格式松散，对数据的顺序性、重复性等方面并没有强制要求
 * levc => Less Player Video Collection
 * @param callback 每个视频项解析成功后的回调处理函数
 */
//TODO 冗余代码，main/common.js也存在相同代码
//虽然可以通过main/preload.js预先暴露给renderer重用
//但过早引入common.js时，也会过早require里面的music-metadata，然后控制台会输出一堆警告
//避免看到一堆毫无意义的警告，暂时采取冗余代码方式解决
export const parseVideoCollectionLines = (lines) => {
    if(!lines || !Array.isArray(lines) || lines.length < 1) return 
    
    const Meta = {
        DELIMITER: '$',
        TITLE: 'title',
        COVER: 'cover',
        YEAR: 'year',
        REGION: 'region',
        LANG: 'lang',
        ARTISTS: 'artists',
        TAGS: 'tags',
        ABOUT: 'about',
        UPDATED: 'updated',
        LIST: 'list',
        keyName: (prop) => (`${Meta.DELIMITER}${prop}${Meta.DELIMITER}`),
    }
    const delimiter = Meta.DELIMITER
    const excludeFilenames = ['index']
    
    const cid = 'levc' + Date.now()
    const collection = { id: cid, platform: 'free-video', title: '', data: [] }
    let listBegan = false
    lines.forEach(line => {
        line = toTrimString(line)
        if(!line || line.startsWith('#') 
            || line.startsWith('//')
            || line.startsWith('/*')
            || line.startsWith('*')) return
        
        if(line.startsWith(Meta.keyName(Meta.TITLE))) {
            const title = line.split(Meta.keyName(Meta.TITLE))[1].trim()
            Object.assign(collection, { title })
        } else if(line.startsWith(Meta.keyName(Meta.COVER))
            || line.startsWith(Meta.keyName(Meta.YEAR))
            || line.startsWith(Meta.keyName(Meta.REGION))
            || line.startsWith(Meta.keyName(Meta.LANG))
            || line.startsWith(Meta.keyName(Meta.ARTISTS))
            || line.startsWith(Meta.keyName(Meta.TAGS))
            || line.startsWith(Meta.keyName(Meta.ABOUT))
            || line.startsWith(Meta.keyName(Meta.UPDATED))) {
            const parts = line.split(delimiter)
            if(!parts || parts.length < 3) return 

            const key = toTrimString(parts[1])
            const value = toTrimString(parts[2])
            collection[key] = value
        } else if(line.startsWith(Meta.keyName(Meta.LIST))) {
            listBegan = true
        } else if(line.startsWith(delimiter) && line.endsWith(delimiter)) {
            const title = line.substring(1, line.length - 1)
            Object.assign(collection, { title })
        } else if(line.includes(delimiter)) {
            //数据行格式：[标题$url]
            const parts = line.split(delimiter)
            if(!parts || parts.length != 2) return

            const subtitle = toTrimString(parts[0]) 
                || guessFilename(parts[0], randomTextWithinAlphabetNums(8), excludeFilenames)
            let url = toTrimString(parts[1])
            if(!url.startsWith('http') 
                && !url.startsWith('blob:http') 
                && !url.startsWith('/')) {
                return
            }
            if(url.startsWith('/')) url = transformUrl(url, FILE_SCHEME)

            collection.data.push({ 
                id: md5(subtitle), 
                platform: detectVideoPlatform(url), 
                title: subtitle, 
                url,
            })
        } else {
            //数据行格式：[url]
            line = transformPath(line)
            /*
            if(!line.startsWith('http') 
                && !line.startsWith('blob:http') 
                && !line.startsWith('/')) {
                return
            }
            */
            if(line.startsWith('/')) line = transformUrl(line, FILE_SCHEME)
            
            const id = randomTextWithinAlphabetNums(8)
            collection.data.push({ 
                id, 
                platform: detectVideoPlatform(line), 
                title: guessFilename(line, id, excludeFilenames), 
                url: line, 
            })
        }
    })

    //重新确认vcType，并根据vcType更新相关信息
    const vcType = (collection.data.length > 1 ? 1 : 0)
    Object.assign(collection, { vcType  })
    if(!vcType) {
        const vcItem = collection.data.length > 0 ? collection.data[0] : {}
        Object.assign(collection, { ...vcItem, data: [] })
        Object.assign(collection, { platform: detectVideoPlatform(collection.url) })
    }

    return collection
}

export const recheckVideoCollectionData = (video) => {
    if(!video) return 
    const { vcType, data } = video
    if(vcType < 1) return
    if(!data || data.length < 1) return

    const _data = []
    data.forEach(item => {
        const { title, url } = item
        if(title == url) return
        if(url.startsWith('http') 
            || url.startsWith('blob:http') 
            || url.startsWith('/')) {
            _data.push(item)
        }
    })
    return Object.assign(video, { data: _data })
}

export const guessFilename = (name, defaultName, excludes) => {
    name = toTrimString(name)
    if(!name) return defaultName
    const from = name.lastIndexOf('/') + 1
    let to = name.lastIndexOf('.')
    //if(to <= from) return defaultName
    to = (to >= 0 ? to : name.length)
    if(from >= to) return name
    const _name = name.substring(from, to)
    if(excludes && Array.isArray(excludes) 
        && excludes.includes(_name)) {
        return defaultName
    }
    return  _name
}

export const parseXML = (text, options) => {
    const parser = new XMLParser(options)
    return parser.parse(text)
}

export const buildXML = (json, options) => {
    const builder = new XMLBuilder(options)
    return builder.build(json)
}


/************ 其他 ************/
//限制数组总长度，超出部分会直接删除
export const trimArray = async (data, limit) => {
    limit = limit || 999
    if (data && data.length > limit) {
        const deleteCount = data.length - limit
        await data.splice(0, deleteCount)
        return deleteCount
    }
    return 0
}

export const trimArrayTail = async (data, limit) => {
    limit = limit || 999
    if (data && data.length > limit) {
        const deleteCount = data.length - limit
        await data.splice(limit, deleteCount)
        return deleteCount
    }
    return 0
}

export const isChineseChar = (ch) => {
    return /[\u4e00-\u9fa5]/.test(ch)
}

export const isEnglishChar = (ch) => {
    return /[A-Za-z]/.test(ch)
}

export const pinyinOfFirstChar = (ch) => {
    ch = toTrimString(ch).substring(0, 1)
    return pinyin(ch, { toneType: 'none' })
}

export const coverDefault = (cover, defaultCover) => {
    return transformUrl(cover, FILE_SCHEME) 
        || transformUrl(defaultCover, FILE_SCHEME) 
        || DEFAULT_COVER_BASE64
}

export const transformUrl = (url, protocal) => {
    url = toTrimString(url)
    if(url.length < 1 || url.includes('://') 
        || url.startsWith('data:')
        || url.startsWith('blob:')) return url
    protocal = protocal || 'https'
    url = url.replace(/\\/g, '/').replace(/\\/g, '/')
    return `${protocal}://${url}`.replace(':////', '://')
}

export const isSupportedFile = (path, suffixes) => {
    if(!suffixes || !Array.isArray(suffixes) || suffixes.length < 1) {
        return false
    }

    const _path = toLowerCaseTrimString(path)
    if(!_path) return false

    for(let i = 0; i < suffixes.length; i++) {
        let suffix = suffixes[i]
        if(!suffix.startsWith('.')) suffix = `.${suffix}`
        if(_path.endsWith(suffix)) return true
    }
    return false
}

export const isSupportedVideo = (path) => {
    const exts = []
    exts.push(...useVideoExts())
    exts.push(...useVideoCollectionExts())
    return isSupportedFile(path, exts)
}

export const isSupportedVideoCollection = (path) => {
    return isSupportedFile(path, useVideoCollectionExts())
}

export const isSupportedImage = (path) => {
    return isSupportedFile(path, useImageExts())
}

export const isSupportedAudio = (path) => {
    const exts = []
    exts.push(...useAudioExts())
    exts.push(...useExtraAudioExts())
    return isSupportedFile(path, exts)
}

export const transformPath = (path) => {
    const _path = toTrimString(path)
    try {
        if(!_path.startsWith('http') 
            && !_path.startsWith('blob:http')
            && !_path.startsWith('data:')) {
            return _path.replace(FILE_PREFIX, '')
                .replace(/\\/g, '/')
                .replace(/\/\//g, '')
                .trim()
        }
    } catch (error) {
        console.log(error)
    }
    return _path
}

export const isLiveStream = (url) => {
    const _url = toLowerCaseTrimString(url)
    return _url.endsWith('.m3u8')
        || _url.includes('.m3u8?') 
        || _url.endsWith('.m3u')
        || _url.includes('.m3u?')
}

export const isLocalFile = (url) => {
    return toTrimString(url).startsWith(FILE_PREFIX)
}

export const isHttpUrl = (url) => {
    return toTrimString(url).startsWith('http')
}


/************ 日期时间 ************/
export const toHhMmss = (millis) => {
    if(!millis && millis !== 0) return 
    let minutes = Math.floor(millis / 60000)
    let seconds = Math.round((millis % 60000) / 1000)
    if (seconds >= 60) { //是否引起进位
        seconds = seconds - 60
        ++minutes
    }
    let hours = Math.floor(minutes / 60)
    minutes -= (hours * 60)
    const _hours = (hours < 1 ? '' : (hours < 10 ? '0' : '') + `${hours}:`)
    minutes = (minutes < 10 ? '0' : '') + minutes
    seconds = (seconds < 10 ? '0' : '') + seconds

    return `${_hours}${minutes}:${seconds}`
}

export const toMmss = (millis) => {
    if(!millis && millis !== 0) return 
    let minutes = Math.floor(millis / 60000)
    let seconds = ((millis % 60000) / 1000).toFixed(0)
    if (seconds >= 60) { //toFixed()是否引起进位
        seconds = seconds - 60
        ++minutes
    }
    minutes = (minutes < 10 ? '0' : '') + minutes
    seconds = (seconds < 10 ? '0' : '') + seconds
    return `${minutes}:${seconds}`
}

export const toMMssSSS = (millis) => {
    let minutes = Math.floor(millis / 60000)
    let fullSecs = ((millis % 60000) / 1000)
    let seconds = Math.floor(fullSecs)
    let millsecs = ((fullSecs - seconds) * 1000).toFixed(0)
    minutes = (minutes < 10 ? '0' : '') + minutes
    seconds = (seconds < 10 ? '0' : '') + seconds
    millsecs = (millsecs < 100 ? (millsecs < 10 ? '00' : '0') : '') + millsecs
    return `${minutes}:${seconds}.${millsecs}`
}

export const toYyyymmdd = (timestamp, sp) => {
    sp = sp || '-'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let mm = (date.getMonth() + 1)
    mm = mm < 10 ? ('0' + mm) : mm
    let dd = date.getDate()
    dd = dd < 10 ? ('0' + dd) : dd
    return yyyy + sp + mm + sp + dd
}

export const extractHhMm = (timestamp) => {
    const date = new Date(timestamp)
    let hh = date.getHours()
    let mm = date.getMinutes()
    //let ss = date.getSeconds()
    hh = hh < 10 ? ('0' + hh) : hh
    mm = mm < 10 ? ('0' + mm) : mm
    //ss = ss < 10 ? ('0' + ss) : ss
    return `${hh}:${mm}`
}

export const extractHhMmSs = (timestamp) => {
    const date = new Date(timestamp)
    let hh = date.getHours()
    let mm = date.getMinutes()
    let ss = date.getSeconds()
    hh = hh < 10 ? ('0' + hh) : hh
    mm = mm < 10 ? ('0' + mm) : mm
    ss = ss < 10 ? ('0' + ss) : ss
    return `${hh}:${mm}:${ss}`
}

export const toYmd = (timestamp, sp) => {
    sp = sp || '.'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let m = (date.getMonth() + 1)
    let d = date.getDate()
    return yyyy + sp + m + sp + d
}

/**
 * @param {*} timestamp 
 * @param {*} sp1 年月日间隔符
 * @param {*} sp2 日期与时间的间隔符
 * @param {*} sp3 时分秒间隔符
 */
export const toYyyymmddHhMmSs = (timestamp, sp1, sp2, sp3) => {
    sp1 = sp1 || '-'
    sp2 = sp2 || ' '
    sp3 = sp3 || ':'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let mm = (date.getMonth() + 1)
    mm = mm < 10 ? ('0' + mm) : mm
    let dd = date.getDate()
    dd = dd < 10 ? ('0' + dd) : dd
    let Hh = date.getHours()
    Hh = Hh < 10 ? ('0' + Hh) : Hh
    let Mm = date.getMinutes()
    Mm = Mm < 10 ? ('0' + Mm) : Mm
    let Ss = date.getSeconds()
    Ss = Ss < 10 ? ('0' + Ss) : Ss
    return yyyy + sp1 + mm + sp1 + dd + sp2
        + Hh + sp3 + Mm + sp3 + Ss
}

export const toMillis = (mmssSSS) => {
    try {
        let timeParts = toTrimString(mmssSSS).split(':')
        const minutes = parseInt(toTrimString(timeParts[0]))
        timeParts = toTrimString(timeParts[1]).split('.')
        const seconds = parseInt(toTrimString(timeParts[0]))
        let millis = 0
        if (timeParts.length > 1) millis = parseInt(toTrimString(timeParts[1]))
        return (minutes * 60 + seconds) * 1000 + millis
    } catch (error) {
        console.log(mmssSSS, "\n", error)
    }
    return -1
}

// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
export const rgbToHsl = (r, g, b) => {
    (r /= 255), (g /= 255), (b /= 255)
    const vmax = Math.max(r, g, b), vmin = Math.min(r, g, b)
    let h, s, l = (vmax + vmin) / 2
  
    if (vmax === vmin) {
      return [0, 0, l] // achromatic
    }
  
    const d = vmax - vmin
    s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin)
    if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0)
    if (vmax === g) h = (b - r) / d + 2
    if (vmax === b) h = (r - g) / d + 4
    h /= 6
  
    return [h, s, l]
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 */
export const hslToRgb = (h, s, l) => {
    let r, g, b

    if (s === 0) {
        r = g = b = l   // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : (l + s - l * s)
        const p = (2 * l - q)
        r = hueToRgb(p, q, h + 1/3)
        g = hueToRgb(p, q, h)
        b = hueToRgb(p, q, h - 1/3)
    }

    return [ 
        Math.round(r * 255), 
        Math.round(g * 255), 
        Math.round(b * 255)
    ]
}

const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
}

export const grayscale = (r, g, b) => {
    return 0.299 * r  + 0.587 * g + 0.114 * b
}

const colorthief = new ColorThief()
export const getPalette = (img, num) => {
    return colorthief.getPalette(img, num || 1)
}

//创建序列数组
export const genSeqNums = (from, to, step) => {
    /*
    const nums = []
    if(step > 0) {
        for(let i = from; i <= to; i += step) nums.push(i)
    } else {
        for(let i = from; i >= to; i += step) nums.push(i)
    }
    return nums
    */
    
    //利用数学上的等价关系，换个写法
    //换个角度看看世界吧，有点看腻了上面的if...else...
    const nums = []
    for(let i = from; (to - i) * step >= 0; i += step) nums.push(i)
    return nums
}
