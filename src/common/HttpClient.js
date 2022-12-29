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
