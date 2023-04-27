//import analyze from 'rgbaster';
import CryptoJS from 'crypto-js';


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
    value = value === 0 ? '0' : value
    return (value || '').toString().trim()
}

export const isBlank = (text) => {
    return toTrimString(text).length < 1
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
    const limit = max < 1024 ? 1024 : max
    return Math.floor(Math.random() * limit) % max
}

export const toUtf8 = (text) => {
    return CryptoJS.enc.Utf8.parse(text)
}

export const base64Encode = (text) => {
    return text ? CryptoJS.enc.Base64.stringify(toUtf8(text)) : null
}

export const base64Decode = (text) => {
    return text ? CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8) : null
}

export const md5 = (text) => {
    return text ? CryptoJS.MD5(text).toString() : null
}

export const hmacMd5 = (text) => {
    return text ? CryptoJS.HmacMD5(text).toString() : null
}

//参考: https://aaron-bird.github.io/2019/03/30/%E7%BC%93%E5%8A%A8%E5%87%BD%E6%95%B0(easing%20function)/
const easeInOutQuad = (currentTime, startValue, changeValue, duration) => {
    currentTime /= duration / 2;
    if (currentTime < 1) return changeValue / 2 * currentTime * currentTime + startValue;
    currentTime--;
    return -changeValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue;
}

//TODO 平滑滚动，算法基本可行，但感觉有点呆！暂时先这样吧
export const smoothScroll = (target, destScrollTop, duration, step) => {
    if (!target) return
    step = step || 6
    const startScrollTop = target.scrollTop
    const distance = destScrollTop - startScrollTop

    let current = 0, scrollAnimationFrameId = null
    const easeInOutScroll = () => {
        if (current >= duration) {
            cancelAnimationFrame(scrollAnimationFrameId)
            return
        }
        const calcScrollTop = easeInOutQuad(current, startScrollTop, distance, duration)
        if (target) target.scrollTop = calcScrollTop
        current += step
        cancelAnimationFrame(scrollAnimationFrameId)
        scrollAnimationFrameId = requestAnimationFrame(easeInOutScroll)
    }
    easeInOutScroll()
}