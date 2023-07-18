import axios from "axios";
import qs from "qs";



//TODO
const DOM_PARSER = new DOMParser()
//axios.defaults.withCredentials = true

const _get = (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if (data && (typeof (data) === 'object')) {
            data = qs.stringify(data)
            url = url.includes('?') ? url : url + '?'
            url = url.endsWith('?') ? (url + data) : (url + "&" + data)
        }
        axios.get(url, config).then(resp => {
            try {
                const result = callback(resp)
                resolve(result)
            } catch (err) {
                resolve(resp.data)
            }
        }, error => reject(error))
        //.catch(error => reject(error))
    })
}

const _post = (url, data, config, callback) => {
    return new Promise((resolve, reject) => {
        if (data && (typeof (data) === 'object')) {
            data = qs.stringify(data)
        }
        axios.post(url, data, config).then(resp => {
            try {
                const result = callback(resp)
                resolve(result)
            } catch (err) {
                resolve(resp.data)
            }
        }, error => reject(error))
        //.catch(error => reject(error))
    })
}

export const getRaw = (url, data, config) => {
    return _get(url, data, config, resp => resp.data)
}

export const getDoc = (url, data, config) => {
    return _get(url, data, config, resp => DOM_PARSER.parseFromString(resp.data, "text/html"))
}

export const getJson = (url, data, config) => {
    return _get(url, data, config, resp => JSON.parse(resp.data))
}

export const postRaw = (url, data, config) => {
    return _post(url, data, config, resp => resp.data)
}

export const postJson = (url, data, config) => {
    return _post(url, data, config, resp => JSON.parse(resp.data))
}

//获取国内IPv4
export const getInternalIpv4 = async () => {
    try {
        const url = 'https://qifu-api.baidubce.com/ip/local/geo/v1/district'
        const json = await getJson(url)
        return json.ip
    } catch (error) {
        console.log(error)
    }
    //随机IP池
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