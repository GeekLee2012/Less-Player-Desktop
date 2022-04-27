import axios from "axios";
import qs from "qs";

//TODO
const DOM_PARSER = new DOMParser()
//axios.defaults.withCredentials = true

const __get = (url, config, parseContentType) => {
    return new Promise((resolve, reject) => {
        axios.get(url, config).then((resp) => {
            try {
                const result = parseContentType(resp)
                resolve(result)
            } catch(err) {
                resolve(resp.data)
            }
        }).catch(err => reject(err))
    })
}

const __post = (url, data, config, parseContentType) => {
    return new Promise((resolve, reject) => {
        if(typeof(data) === 'object') {
            data = qs.stringify(data)
        }
        axios.post(url, data, config).then((resp) => {
            try {
                const result = parseContentType(resp)
                resolve(result)
            } catch(err) {
                resolve(resp.data)
            }
        }).catch(err => reject(err))
    })
}

export const getRaw = (url, config) => {
    return __get(url, config, (resp) => resp.data)
}

export const getDoc = (url, config) => {
    return __get(url, config, (resp) => DOM_PARSER.parseFromString(resp.data, "text/html"))
}

export const getJson = (url, config) => {
    return __get(url, config, (resp) => JSON.parse(resp.data))
}

export const postRaw = (url, data, config) => {
    return __post(url, data, config, (resp) => resp.data)
}

export const postJson = (url, data, config) => {
    return __post(url, data, config, (resp) => JSON.parse(resp.data))
}
