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
export const getInternalIpv4 = () => {
    return new Promise(async (resolve, reject) => {
        let ipv4 = '128.108.208.188'
        const sites = [{
            url: 'https://ip233.cn/',
            rule: '.container #internal-ip'
        }, {
            url: 'https://zh-hans.ipshu.com/',
            rule: '.local_info .row .col p a'
        }, {
            url: 'https://bajiu.cn/ip/',
            rule: '.cx div span'
        }, {
            url: 'https://iplocation.com/',
            rule: '.rubber-container .result-table .ip'
        }]
        for (var i = 0; i < sites.length; i++) {
            const { url, rule } = sites[i]
            const doc = await getDoc(url)
            const el = doc.querySelector(rule)
            if (!el) continue

            const ipText = (el.textContent || '').trim()
            if (ipText.length >= 7) { //简单校验一下即可
                ipv4 = ipText
                break
            }
        }
        resolve(ipv4)
    })
}