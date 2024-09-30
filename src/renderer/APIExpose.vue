<script setup>
import { inject, provide, toRaw, onMounted, h, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePluginStore } from './store/pluginStore';
import { usePlatformStore } from './store/platformStore';
import { useAppCommonStore } from './store/appCommonStore';
import { useSettingStore } from './store/settingStore';
import {
    get, post, getJson, getDoc, getRaw, postRaw, postJson,
    parseJsonp, parseHtml, qsStringify, getInternalIpv4,
} from '../common/HttpClient';
import {
    isDevEnv, toTrimString, toLowerCaseTrimString, toUpperCaseTrimString,
    isBlank, randomTextWithinAlphabetNums as randomTextDefault, randomText, nextInt,
    md5, hmacMd5, sha1, sha256, sha512, base64Parse, base64Stringify, hexDecode,
    aesEncryptDefault, aesEncryptHexText, rsaEncrypt, rsaEncryptDefault,
    aesDecryptText, tryCallDefault, tryCall, tryCallOnObject, transformUrl,
    stringEquals, stringEqualsIgnoreCase, readLines,
    ipcRendererSend, ipcRendererInvoke,  toMmss, 
    toMMssSSS, toMillis, toYmd, toYyyymmdd, toYyyymmddHhMmSs,
} from '../common/Utils';
import {
    FILE_PREFIX, ActivateState,
    LESS_MAGIC_CODE, ImageProtocal,
    DEFAULT_COVER_BASE64
} from '../common/Constants';
import { Category } from '../common/Category';
import { Playlist } from '../common/Playlist';
import { Track } from '../common/Track';
import { Album } from '../common/Album';
import { Lyric } from '../common/Lyric';
import { usePlayStore } from './store/playStore';
import { onEvents, emitEvents } from '../common/EventBusWrapper';



const { addCustomRoute, visitCommonRoute } = inject('appRoute')

const { plugins } = storeToRefs(usePluginStore())
const { removePlugin, updatePlugin } = usePluginStore()
const { addPlatform, removePlatform } = usePlatformStore()
const { spectrumParams } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast, hideAllCtxMenus } = useAppCommonStore()
const { getImageUrlByQuality } = useSettingStore()
const { currentTrack } = storeToRefs(usePlayStore())


let isConfirmDialogShowing = ref(false)
const setConfirmDialogShowing = (value) => isConfirmDialogShowing.value = value

const showConfirm = async (msg, title) => {
  if (isConfirmDialogShowing.value) return false
  setConfirmDialogShowing(true)
  hideAllCtxMenus(false)
  const ok = await ipcRendererInvoke('show-confirm', {
    title: title || '确认',
    msg
  })
  setConfirmDialogShowing(false)
  return ok
}

//打开默认浏览器，并访问超链接
const visitLink = (url) => {
    return !isBlank(url) && ipcRendererSend('visit-link', transformUrl(url))
}

const onWatches = (arr) => {
    if(!arr || !Array.isArray(arr) || !arr.length < 1) {
        throw new Error('parameter type error: not a valid array')
    }
    arr.forEach((source, callback, options) => {
        if(!source) return
        if(!callback || typeof callback != 'function') return
        watch(source, callback, options)
    })
}

/* 开放API */
const APIEvents = {
    TRACK_GET_PLAY_URL: 'TRACK_GET_PLAY_URL',
    VIDEO_GET_PLAY_URL: 'VIDEO_GET_PLAY_URL',
    TRACK_DRAW_SPECTRUM: 'TRACK_DRAW_SPECTRUM',
    TRACK_VISUAL_CANVAS: 'TRACK_VISUAL_CANVAS'
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
    //播放相关
    TRACK_CURRENT_PLAYING: 'TRACK_CURRENT_PLAYING',
    TRACK_SPECTRUM_PARAMS: 'TRACK_SPECTRUM_PARAMS',
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
        //支持类型：function、object
        if (!'object|function'.includes(typeof handler)) return
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
                    if (typeof handler == 'object') {
                        const { unmounted } = handler
                        if (unmounted) tryCallOnObject(unmounted, handler)
                    }
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
        emitEvents('app-removePlugin')
        ipcRendererInvoke('app-removePlugin', filePath)
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
    if (eventName) emitEvents(`plugins-accessResult-${eventName}`, args)
}

//TODO 暂时仅在Renderer端提供，所以API能力也有限
//Nodejs端（ Main进程 ）的API计划实现中，但安全性、依赖等问题不好处理
//目前存在问题：无法感知当前获取权限的是哪个插件
const lessAPI = {
    version: '1.0.0',
    constants: {
        LESS_IMAGE_PREFIX: ImageProtocal.prefix,
        DEFAULT_COVER_BASE64,
    },
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
        tryCallOnObject,
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
            try {
                EventHandlerRegistrations.register(event, handler)
            } catch (error) {
                console.log(error)
            }
        },
        unregister(event, handler) {
            try {
                EventHandlerRegistrations.unregister(event, handler)
            } catch (error) {
                console.log(error)
            }
        },
    },
    permissions: {
        APIPermissions,
        async access(permission, ...options) { //获取访问权限
            let result = null
            try {
                //开发者工具
                if (permission == APIPermissions.OPEN_DEV_TOOLS) {
                    ipcRendererSend('app-openDevTools')
                } else if (permission == APIPermissions.CLOSE_DEV_TOOLS) {
                    ipcRendererSend('app-closeDevTools')
                }
                //获取相关信息
                else if (permission == APIPermissions.GET_USER_AGENT) {
                    result = await ipcRendererInvoke('app-userAgent') || ''
                } else if (permission == APIPermissions.GET_COOKIE) {
                    result = await ipcRendererInvoke('app-getCookie', options[0]) || ''
                }
                //请求头信息
                else if (permission == APIPermissions.ADD_REQUEST_HANDLER) {
                    result = await ipcRendererInvoke('app-addRequestHandler', options[0]) || ''
                } else if (permission == APIPermissions.REMOVE_REQUEST_HANDLER) {
                    result = await ipcRendererInvoke('app-removeRequestHandler', options[0]) || ''
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
                //播放相关
                else if (permission == APIPermissions.TRACK_CURRENT_PLAYING) {
                    const { id, platform, title, cover, artist, album, duration } = toRaw(currentTrack.value || {})
                    result = { id, platform, title, cover, artist, album, duration }
                } else if (permission == APIPermissions.TRACK_SPECTRUM_PARAMS) {
                    result = toRaw(spectrumParams.value)
                }
                onAccessResult(permission, result, options)
            } catch (error) {
                console.log(error)
            }
            return result
        },
    },
    renderers: {
        h,
    }
}

window.lessAPI = {}
const exposeAPI = (apis) => {
    if(apis && typeof apis == 'object') {
        Object.assign(window.lessAPI, { ...apis })
    }
    //放在最后执行，保证不被覆盖
    Object.assign(window.lessAPI, { ...lessAPI })
}

//放在后面执行
exposeAPI()
loadPluginsOnStartup()

//API相关
provide('apiExpose', {
    exposeAPI,
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
    getExVisualCanvasHandlersLength: () => {
        const handlers = EventHandlerRegistrations.handlers(APIEvents.TRACK_VISUAL_CANVAS) || []
        return handlers.length
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
    getExVideoPlayUrl: async (video, noToast) => {
        const _video = { ...toRaw(video) }
        const handler = EventHandlerRegistrations.lastHandler(APIEvents.VIDEO_GET_PLAY_URL)
        if (handler && (typeof handler == 'function')) {
            if (!noToast) showToast(`尝试从插件获取视频源<br>请耐心等待一下哟`)
            return handler(_video)
        }
    },
    /**
     * 绘制频谱
     * @param {*} canvas 
     * @param {*} params  { freqData, freqBinCount, sampleRate, 
     *                      analyser, spectrumColor, stroke, 
     *                      canvasBgColor, isSimpleLayoutMode }
     * @param {*} index
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
    /**
     * 
     * @param {*} params  { freqData, freqBinCount, sampleRate, 
     *                      analyser, spectrumColor, stroke, 
     *                      canvasBgColor, isSimpleLayoutMode }
     * @param {*} index
     */
    toggleExVisualCanvas: async (containerElSelector, index, visible) => {
        try {
            const handlers = EventHandlerRegistrations.handlers(APIEvents.TRACK_VISUAL_CANVAS)
            if (!handlers || handlers.length < 1) return Promise.reject('noHandler')
            const handler = handlers[index]
            if (!handler || (typeof handler != 'object')) return Promise.reject('noHandler')
            const containerEl = document.querySelector(containerElSelector)
            if (!containerEl) return Promise.reject('noContainer')

            const { mounted, unmounted } = handler
            if (visible) tryCallOnObject(unmounted, handler, containerEl)
            tryCallOnObject(visible ? mounted : unmounted, handler, containerEl)
        } catch (error) {
            Promise.reject(error)
        }
    },
    showConfirm,
    visitLink,
    onEvents,
    emitEvents,
})
</script>

<template>
    <slot></slot>
</template>

<style>
</style>