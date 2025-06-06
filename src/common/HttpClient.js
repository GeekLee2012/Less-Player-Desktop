import axios from "axios";
import qs from "qs";
import { isBlank, isDevEnv, stringEquals, toTrimString, tryCallDefault } from "./Utils";



//axios.defaults.withCredentials = true
//axios.defaults.timeout = 60000

export const parseHtml = (text) => {
    try {
        return new DOMParser().parseFromString(text, 'text/html')
    } catch(error) {
        if(isDevEnv()) console.log(error)
    }
    return text
}

export const parseJsonp = (jsonp) => {
    if(isDevEnv()) console.log('[ JSONP ]', jsonp)
    if(isBlank(jsonp)) return 
    if(typeof jsonp == 'object') return jsonp
    const index = jsonp.indexOf('(')
    const json = Function(jsonp.substring(index))()
    if(!json || (typeof json != 'object')) return
    return json
}

export const qsStringify = (data, config) => {
    if(config && config.headers) {
        const contentType = config.headers['Content-Type'] || config.headers['content-type']
        if(stringEquals(contentType, 'application/json')) return data
    }
    return qs.stringify(data, { arrayFormat: 'repeat' })
}

export const qsStringifyUrl = (url, data, config) => {
    let _url = toTrimString(url)
    const hasData = data && (typeof data === 'object')
    if (hasData) {
        _url = _url.includes('?') ? _url : `${_url}?`
        _url = _url.endsWith('?') ? _url : `${_url}&`
        const _data = qsStringify(data, config)
        _url = `${_url}${_data}`
    }
    return _url
}

const parseJson = (data) => {
    //if(!resp || !resp.data) return 
    //const { data } = resp
    if(data && typeof data == 'string') {
        try {
            return JSON.parse(data)
        } catch(error1) {
            console.log(error1)
            try {
                return parseJsonp(data)
            } catch(error2) {
                console.log(error2)
            }
        }
    }
    return data
}

const mergeConfig = (config) => {
    const timeout = 30000
    if(!config) return { timeout }
    if(!config['timeout']) Object.assign(config, { timeout })
    return config
}

export const get = async (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if(isBlank(url)) return reject('noUrl')
        config = mergeConfig(config)
        const _url = qsStringifyUrl(url, data, config)
        axios.get(_url, config)
            .then(resp => resolve(tryCallDefault(callback, resp, resp)), error => reject(error))
            .catch(error => reject(error))
    })
}

export const post = async (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if(isBlank(url)) return reject('noUrl')
        const _url = toTrimString(url)
        const hasData = data && (typeof data === 'object')
        config = mergeConfig(config)
        const _data = hasData ? qsStringify(data, config) : data
        axios.post(_url, _data, config)
            .then(resp => resolve(tryCallDefault(callback, resp, resp)), error => reject(error))
            .catch(error => reject(error))
    })
}

export const getRaw = (url, data, config) => {
    return get(url, data, config, resp => resp.data)
}

export const getDoc = (url, data, config) => {
    return get(url, data, config, resp => parseHtml(resp.data))
}

export const getJson = (url, data, config) => {
    return get(url, data, config, resp => parseJson(resp.data))
}

export const postRaw = (url, data, config) => {
    return post(url, data, config, resp => resp.data)
}

export const postJson = (url, data, config) => {
    return post(url, data, config, resp => parseJson(resp.data))
}


//获取国内IPv4，失败时随机返回内置IP池中的IP
export const getInternalIpv4 = async () => {
    try {
        const url = 'https://qifu-api.baidubce.com/ip/local/geo/v1/district'
        const { ip } = await getJson(url, null, { timeout: 3000 })
        return ip
    } catch (error) {
        if(isDevEnv()) console.log(error)
    }
    //兜底，随机IP池
    const ipPools = [
        '128.108.208.188', '116.233.123.121', '116.181.153.135',
        '115.102.151.135', '112.102.11.138', '116.233.188.121',
        '113.112.168.132', '115.122.188.89', '116.233.188.118',
        '115.122.128.189', '116.233.125.121', '116.233.135.88',
        '117.156.118.118', '116.156.118.118', '122.122.128.189',
        '113.112.168.25', '113.118.128.25', '113.118.128.66'
    ]
    const index = parseInt(Math.random() * (ipPools.length - 1))
    return ipPools[index]
}