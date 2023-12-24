<script setup>
import { inject, provide, toRaw, onMounted, h } from 'vue';
import { storeToRefs } from 'pinia';
import { usePluginStore } from './store/pluginStore';
import { usePlatformStore } from './store/platformStore';
import { useAppCommonStore } from './store/appCommonStore';
import { useSettingStore } from './store/settingStore';
import EventBus from '../common/EventBus';
import {
    get, post, getJson, getDoc, getRaw, postRaw, postJson,
    parseJsonp, parseHtml, qsStringify, getInternalIpv4,
} from '../common/HttpClient';
import {
    isDevEnv, useIpcRenderer, toTrimString, toLowerCaseTrimString, toUpperCaseTrimString,
    isBlank, randomTextWithinAlphabetNums as randomTextDefault, randomText, nextInt,
    md5, hmacMd5, sha1, sha256, sha512, base64Parse, base64Stringify, hexDecode,
    aesEncryptDefault, aesEncryptHexText, rsaEncrypt, rsaEncryptDefault,
    aesDecryptText, tryCallDefault, tryCall, transformUrl,
    stringEquals, stringEqualsIgnoreCase, readLines,
} from '../common/Utils';
import { toMmss, toMMssSSS, toMillis, toYmd, toYyyymmdd, toYyyymmddHhMmSs } from '../common/Times';
import { FILE_PREFIX, ActivateState, LESS_MAGIC_CODE } from '../common/Constants';
import { Category } from '../common/Category';
import { Playlist } from '../common/Playlist';
import { Track } from '../common/Track';
import { Album } from '../common/Album';
import { Lyric } from '../common/Lyric';



const { addCustomRoute, visitCommonRoute } = inject('appRoute')

const ipcRenderer = useIpcRenderer()

const { plugins } = storeToRefs(usePluginStore())
const { removePlugin, updatePlugin } = usePluginStore()
const { addPlatform, removePlatform } = usePlatformStore()
const { showToast, showFailToast } = useAppCommonStore()
const { getImageUrlByQuality } = useSettingStore()

const APIEvents = {
    TRACK_GET_PLAY_URL: 'TRACK_GET_PLAY_URL',
    VIDEO_GET_PLAY_URL: 'VIDEO_GET_PLAY_URL',
    TRACK_DRAW_SPECTRUM: 'TRACK_DRAW_SPECTRUM',
}

const APIPermissions = {
    OPEN_DEV_TOOLS: 'OPEN_DEV_TOOLS',
    CLOSE_DEV_TOOLS: 'CLOSE_DEV_TOOLS',
    GET_USER_AGENT: 'GET_USER_AGENT',
    GET_COOKIE: 'GET_COOKIE',
    //路由
    ADD_ROUTE: 'ADD_ROUTE',
    VISIT_ROUTE: 'VISIT_ROUTE',
    //自定义平台
    ADD_PLATFORM: 'ADD_PLATFORM',
    REMOVE_PLATFORM: 'REMOVE_PLATFORM',
    //自定义请求处理器，主要目的为重新设置请求头信息
    ADD_REQUEST_HANDLER: 'ADD_REQUEST_HANDLER',
    REMOVE_REQUEST_HANDLER: 'REMOVE_REQUEST_HANDLER',
}

//事件处理器注册中心
const EventHandlerRegistrations = {
    mappings: {},
    handlers(event) { return this.mappings[event] },
    hasHanlders(event) {
        const handlers = this.handlers(event)
        return handlers && handlers.length > 0
    },
    lastHandler(event) {
        const handlers = this.handlers(event)
        return (handlers && handlers.length > 0) ?
            handlers[handlers.length - 1] : null
    },
    register(event, handler) {
        if (!event || !handler) return
        if (!Object.hasOwn(APIEvents, event)) return
        if (typeof handler != 'object' && typeof handler != 'function') return
        if (Array.isArray(handler)) return

        this.mappings[event] = this.mappings[event] || []
        const index = this.mappings[event].findIndex(item => (item == handler))
        if (index > -1) this.mappings[event].splice(index, 1)
        this.mappings[event].push(handler)
    },
    unregister(event, handler) {
        if (!event || !handler) return
        if (!Object.hasOwn(APIEvents, event)) return
        const handlers = this.mappings[event]
        if (handlers && handlers.length > 0) {
            for (let i = 0; i < handlers.length; i++) {
                if (handlers[i] == handler) {
                    handlers.splice(i, 1)
                    break
                }
            }
            if (handlers.length < 1) Reflect.deleteProperty(this.mappings, event)
        }
    }
}

const activatePluginNow = async (plugin, onSuccess, onError) => {
    if (!plugin) return
    const { path, main, mainModule } = plugin
    if (!path || !main) return tryCall(onError, plugin)
    if (!mainModule || !mainModule.activate) {
        import(/* @vite-ignore */ `${FILE_PREFIX}${path}/${main}`).then(mainModule => {
            Object.assign(plugin, { mainModule })
            tryCall(mainModule.activate, plugin, onSuccess, onError)
        }).catch(error => {
            console.log(error)
            tryCall(onError, plugin)
        })
    } else {
        tryCall(mainModule.activate, plugin, onSuccess, onError)
    }
}

const deactivatePluginNow = async (plugin, onSuccess, onError) => {
    if (!plugin) return
    const { path, main, mainModule } = plugin
    if (!path || !main) return tryCall(onError, plugin)
    if (!mainModule || !mainModule.deactivate) {
        import(/* @vite-ignore */ `${FILE_PREFIX}${path}/${main}`).then(mainModule => {
            Object.assign(plugin, { mainModule })
            tryCall(mainModule.deactivate, plugin, onSuccess, onError)
        }).catch(error => {
            console.log(error)
            tryCall(onError, plugin)
        })
    } else {
        tryCall(mainModule.deactivate, plugin, onSuccess, onError)
    }
}

const removePluginNow = (plugin) => {
    if (!plugin) return
    try {
        removePlugin(plugin)
        const { path, main, type } = plugin
        const filePath = !type ? `${path}/${main}` : path
        if (ipcRenderer) {
            EventBus.emit('app-removePlugin')
            ipcRenderer.invoke('app-removePlugin', filePath)
        }
    } catch (error) {
        console.log(error)
    }
}

//异步加载插件
const loadPluginsOnStartup = async () => {
    if (plugins.value.length < 1) return
    if (isDevEnv()) console.log('[ PLUGINS - Startup ] 开始加载插件')
    //TODO 当前实现方式，不好确定全部加载完成的时机，以进行相关回调
    plugins.value.forEach((plugin, index) => {
        const { state } = plugin
        if (state != ActivateState.ACTIVATED) return
        activatePluginNow(plugin, null, (plugin) => {
            updatePlugin(plugin, { state: ActivateState.INVALID })
        })
    })
}

const onAccessResult = async (permission, result, options) => {
    let eventName = null, args = null
    //平台权限
    if (permission === APIPermissions.ADD_PLATFORM) {
        eventName = 'addPlatform'
        args = options[0]
    }
    //事件通知
    if (eventName) EventBus.emit(`plugins-accessResult-${eventName}`, args)
}

//TODO 对外提供API
//暂时仅在Renderer端提供，所以API能力也有限
//Nodejs端（ Main进程 ）的API计划实现中，但安全性、依赖等问题不好处理
//目前存在问题：无法感知当前获取权限的是哪个插件
window.lessAPI = {
    version: '1.0.0',
    common: {
        Category,
        Playlist,
        Track,
        Album,
        Lyric,
    },
    utils: {
        toMmss,
        toMMssSSS,
        toMillis,
        toYmd,
        toYyyymmdd,
        toYyyymmddHhMmSs,
        isBlank,
        toTrimString,
        toLowerCaseTrimString,
        toUpperCaseTrimString,
        stringEquals,
        stringEqualsIgnoreCase,
        readLines,
        nextInt,
        getImageUrlByQuality,
        tryCallDefault,
        tryCall,
        transformUrl,
    },
    crypto: {
        randomText,
        randomTextDefault,
        md5,
        hmacMd5,
        sha1,
        sha256,
        sha512,
        aesEncryptDefault,
        aesEncryptHexText,
        rsaEncrypt,
        rsaEncryptDefault,
        base64Stringify,
        base64Parse,
        hexDecode,
        aesDecryptText,
    },
    nets: {
        getDoc,
        getRaw,
        getJson,
        postRaw,
        postJson,
        get,
        post,
        parseJsonp,
        parseHtml,
        qsStringify,
        getInternalIpv4,
    },
    events: {
        APIEvents,
        register(event, handler) {
            EventHandlerRegistrations.register(event, handler)
        },
        unregister(event, handler) {
            EventHandlerRegistrations.unregister(event, handler)
        },
    },
    permissions: {
        APIPermissions,
        async access(permission, ...options) { //获取访问权限
            let result = null
            //开发者工具
            if (permission == APIPermissions.OPEN_DEV_TOOLS) {
                if (ipcRenderer) ipcRenderer.send('app-openDevTools')
            } else if (permission == APIPermissions.CLOSE_DEV_TOOLS) {
                if (ipcRenderer) ipcRenderer.send('app-closeDevTools')
            }
            //获取相关信息
            else if (permission == APIPermissions.GET_USER_AGENT) {
                result = ipcRenderer ? (await ipcRenderer.invoke('app-userAgent')) : ''
            } else if (permission == APIPermissions.GET_COOKIE) {
                result = ipcRenderer ? (await ipcRenderer.invoke('app-getCookie', options[0])) : ''
            }
            //请求头信息
            else if (permission == APIPermissions.ADD_REQUEST_HANDLER) {
                result = ipcRenderer ? (await ipcRenderer.invoke('app-addRequestHandler', options[0])) : ''
            } else if (permission == APIPermissions.REMOVE_REQUEST_HANDLER) {
                result = ipcRenderer ? (await ipcRenderer.invoke('app-removeRequestHandler', options[0])) : ''
            }
            //路由
            else if (permission == APIPermissions.ADD_ROUTE) {
                result = addCustomRoute(options[0])
            } else if (permission == APIPermissions.VISIT_ROUTE) {
                result = visitCommonRoute(options[0])
            }
            //自定义平台
            else if (permission == APIPermissions.ADD_PLATFORM) {
                //{ code, vendor, name, shortName, online, types, scopes, artistTabs, searchTabs, weight }
                addPlatform(options[0])
            } else if (permission == APIPermissions.REMOVE_PLATFORM) {
                removePlatform(options[0])
            }
            onAccessResult(permission, result, options)
            return result
        },
    },
    renderers: {
        h,
    }
}

//放在后面执行
loadPluginsOnStartup()

//对外提供API相关
provide('apiExpose', {
    activatePluginNow,
    deactivatePluginNow,
    removePluginNow,
    hasExTrackPlayUrlHandlers: () => {
        return EventHandlerRegistrations.hasHanlders(APIEvents.TRACK_GET_PLAY_URL)
    },
    hasExVideoPlayUrlHandlers: () => {
        return EventHandlerRegistrations.hasHanlders(APIEvents.VIDEO_GET_PLAY_URL)
    },
    hasExDrawSpectrumHandlers: () => {
        return EventHandlerRegistrations.hasHanlders(APIEvents.TRACK_DRAW_SPECTRUM)
    },
    /**
     * 获取音频播放url
     * @param {*} track 
     */
    getExTrackPlayUrl: async (track, noToast) => {
        const _track = { ...toRaw(track) }
        //移除非必要信息
        const excludeProps = ['url', 'lyric', 'lyricTran', 'lyricRoma',
            'publishTime', 'score', 'isCandidate']
        excludeProps.forEach(prop => Reflect.deleteProperty(_track, prop))
        //TODO 选择策略
        const handler = EventHandlerRegistrations.lastHandler(APIEvents.TRACK_GET_PLAY_URL)
        if (handler && (typeof handler == 'function')) {
            if (!noToast) showToast(`尝试从插件获取音源<br>请耐心等待一下哟`)
            return handler(_track)
        }
    },
    /**
     * 获取视频播放url
     * @param {*} video 
     */
    getExVideoPlayUrl: async (video) => {
        const _video = { ...toRaw(video) }
        const handler = EventHandlerRegistrations.lastHandler(APIEvents.VIDEO_GET_PLAY_URL)
        if (handler && (typeof handler == 'function')) {
            showToast(`尝试从插件获取视频源<br>请耐心等待一下哟`)
            return handler(_video)
        }
    },
    /**
     * 绘制频谱
     * @param {*} canvas 
     * @param {*} params  { freqData, freqBinCount, sampleRate, 
     *                      analyser, spectrumColor, stroke, 
     *                      canvasBgColor, isSimpleLayoutMode }
     */
    drawExSpectrum: async (canvas, params, index) => {
        try {
            const handlers = EventHandlerRegistrations.handlers(APIEvents.TRACK_DRAW_SPECTRUM)
            if (!handlers || handlers.length < 1) return Promise.reject('noHandler')
            const handler = handlers[index]
            if (!handler || (typeof handler != 'function')) return Promise.reject('noHandler')
            return handler(canvas, params)
        } catch (error) {
            Promise.reject(error)
        }
    },
})
</script>

<template>
    <slot></slot>
</template>