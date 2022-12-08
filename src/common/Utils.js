export const useIpcRenderer = () => {
    try {
        return electronAPI ? electronAPI.ipcRenderer : null
    } catch(error) {
        //Do Nothing
    }
    return null
}

export const isMacOS = () => {
    try {
        return electronAPI ? electronAPI.isMacOS : null
    } catch(error) {
        //Do Nothing
    }
    return null
}

export const isWinOS = () => {
    try {
        return electronAPI ? electronAPI.isWinOS : null
    } catch(error) {
        //Do Nothing
    }
    return null
}

export const useUseCustomTrafficLight = () => {
    try {
        return electronAPI ? electronAPI.useCustomTrafficLight : false
    } catch(error) {
        //Do Nothing
    }
    return false
}

export const ALPHABET_NUMS = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz01234567890'

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

/** 随机字符串: 大小写字母和数字组成 */
export const randomTextWithinAlphabetNums = (len) => {
    return randomText(ALPHABET_NUMS, len)
}

export const toTrimString = (value) => {
    value = value == 0 ? '0' : value
    return (value || '').toString().trim()
} 