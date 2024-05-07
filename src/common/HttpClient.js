import axios from "axios";
import qs from "qs";
import { isBlank, isDevEnv, tryCallDefault } from "./Utils";



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

export const qsStringify = (data) => (qs.stringify(data))

const tryResponseJson = (resp) => {
    if(!resp || !resp.data) return 
    const { data } = resp
    if(data && typeof data == 'string') {
        try {
            return JSON.parse(data)
        } catch(error1) {
            try {
                return parseJsonp(data)
            } catch(error2) {
                console.log(error2)
            }
        }
    }
    return data
}

export const get = async (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if(isBlank(url)) return Promise.reject('noUrl')
        if (data && (typeof data === 'object')) {
            data = qsStringify(data)
            if(!url.includes('?')) url = `${url}?`
            const _and = url.endsWith('?') ? '' : '&'
            url = `${url}${_and}${data}`
        }
        axios.get(url, config)
            .then(resp => resolve(tryCallDefault(callback, resp, resp)), error => reject(error))
            .catch(error => reject(error))
    }, error => Promise.reject(error)).catch(error => Promise.reject(error))
}

export const post = async (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if(isBlank(url)) return Promise.reject('noUrl')
        if (data && (typeof data === 'object')) data = qsStringify(data)
        axios.post(url, data, config)
            .then(resp => resolve(tryCallDefault(callback, resp, resp)), error => reject(error))
            .catch(error => reject(error))
    }, error => Promise.reject(error)).catch(error => Promise.reject(error))
}

export const getRaw = (url, data, config) => {
    return get(url, data, config, resp => resp.data)
}

export const getDoc = (url, data, config) => {
    return get(url, data, config, resp => parseHtml(resp.data))
}

export const getJson = (url, data, config) => {
    return get(url, data, config, resp => tryResponseJson(resp))
}

export const postRaw = (url, data, config) => {
    return post(url, data, config, resp => resp.data)
}

export const postJson = (url, data, config) => {
    return post(url, data, config, resp => tryResponseJson(resp))
}

//获取国内IPv4，失败时随机返回内置IP池中的IP
export const getInternalIpv4 = async () => {
    try {
        const url = 'https://qifu-api.baidubce.com/ip/local/geo/v1/district'
        const { ip } = await getJson(url)
        return ip
    } catch (error) {
        console.log(error)
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