import axios from "axios";
import qs from "qs";



//TODO
const DOM_PARSER = new DOMParser()
//axios.defaults.withCredentials = true

const __get = (url, data, config, parseContentType) => {
    return new Promise((resolve, reject) => {
        if (data && (typeof (data) === 'object')) {
            data = qs.stringify(data)
            url = url.includes('?') ? url : url + '?'
            url = url.endsWith('?') ? (url + data) : (url + "&" + data)
        }
        axios.get(url, config).then(resp => {
            try {
                const result = parseContentType(resp)
                resolve(result)
            } catch (err) {
                resolve(resp.data)
            }
        }, error => reject(error))
        //.catch(error => reject(error))
    })
}

const __post = (url, data, config, parseContentType) => {
    return new Promise((resolve, reject) => {
        if (data && (typeof (data) === 'object')) {
            data = qs.stringify(data)
        }
        axios.post(url, data, config).then(resp => {
            try {
                const result = parseContentType(resp)
                resolve(result)
            } catch (err) {
                resolve(resp.data)
            }
        }, error => reject(error))
        //.catch(error => reject(error))
    })
}

export const getRaw = (url, data, config) => {
    return __get(url, data, config, resp => resp.data)
}

export const getDoc = (url, data, config) => {
    return __get(url, data, config, resp => DOM_PARSER.parseFromString(resp.data, "text/html"))
}

export const getJson = (url, data, config) => {
    return __get(url, data, config, resp => JSON.parse(resp.data))
}

export const postRaw = (url, data, config) => {
    return __post(url, data, config, resp => resp.data)
}

export const postJson = (url, data, config) => {
    return __post(url, data, config, resp => JSON.parse(resp.data))
}

//获取国内IPv4
export const getInternalIpv4 = () => {
    return new Promise(async (resolve, reject) => {
        let ipv4 = '128.108.208.188'
        const urls = ['https://ip233.cn/',
            'https://zh-hans.ipshu.com/',
            'https://bajiu.cn/ip/',
            'https://iplocation.com/'
        ]
        const rules = ['.container #internal-ip',
            '.local_info .row .col p a',
            '.cx div span',
            '.rubber-container .result-table .ip'
        ]
        for (var i = 0; i < urls.length; i++) {
            const doc = await getDoc(urls[i])
            const el = doc.querySelector(rules[i])
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