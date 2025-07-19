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
    aesDecryptDefault, tryCallDefault, tryCall, tryCallOnObject, transformUrl,
    stringEquals, stringEqualsIgnoreCase, readLines,
    ipcRendererSend, ipcRendererInvoke,  toMmss, 
    toMMssSSS, toMillis, toYmd, toYyyymmdd, toYyyymmddHhMmSs,
    escapeHtml, parseXML, buildXML, guessFilename,
    isSupportedAudio, encodeLess, decodeLess, 
    isIpcRendererSupported, isAsyncFn, stringPrefixEquals,
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
import { tify, sify } from 'chinese-conv'; 



const { addCustomRoute, visitCommonRoute } = inject('appRoute')

const { plugins } = storeToRefs(usePluginStore())
const { removePlugin, updatePlugin, getPlugin } = usePluginStore()
const { addPlatform, removePlatform } = usePlatformStore()
const { spectrumParams } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast, hideAllCtxMenus } = useAppCommonStore()
const { getImageUrlByQuality } = useSettingStore()
const { currentTrack } = storeToRefs(usePlayStore())
const { playTrack, resetQueue, addTracks, playNextTrack } = usePlayStore()


let isConfirmDialogShowing = ref(false)
const setConfirmDialogShowing = (value) => isConfirmDialogShowing.value = value

const showConfirm = async (msg, title) => {
  if (isConfirmDialogShowing.value) return false
  setConfirmDialogShowing(true)
  hideAllCtxMenus(false)
  
  if(!isIpcRendererSupported()) {
    setConfirmDialogShowing(false)
    return true
  }

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
    TRACK_DRAW_SPECTRUM: {
        name: 'track_draw_spectrum',
        cname: '绘制频谱',
    },
    TRACK_VISUAL_CANVAS: {
        name: 'track_visual_canvas',
        cname: '绘制可视化Canvas',
    },
}

const APIPermissions = {
    OPEN_DEV_TOOLS: {
        name: 'app-openDevTools',
        cname: '启用开发者工具',
    },
    CLOSE_DEV_TOOLS: {
        name: 'app-closeDevTools',
        cname: '关闭开发者工具',
    },
    GET_USER_AGENT: {
        name: 'app-userAgent',
        cname: '获取UserAgent信息',
    },
    GET_COOKIE: {
        name: 'app-getCookie',
        cname: '获取Cookie信息',
    },
    //路由
    ADD_ROUTE: {
        name: 'app-addRoute',
        cname: '添加路由',
    },
    VISIT_ROUTE: {
        name: 'app-visitRoute',
        cname: '访问路由'
    },
    //自定义平台
    REGISTER_PLATFORM: {
        name: 'app-addPlatform',
        cname: '注册平台信息',
    },
    UNREGISTER_PLATFORM: {
        name: 'app-removePlatform',
        cname: '移除平台信息',
    },
    //自定义请求处理器，主要目的为重新设置请求头信息
    ADD_REQUEST_HANDLER: {
        name: 'app-addRequestHandler',
        cname: '添加请求头信息',
    },
    UPDATE_REQUEST_HANDLER: {
        name: 'app-updateRequestHandler',
        cname: '修改请求头信息',
    },
    REMOVE_REQUEST_HANDLER: {
        name: 'app-removeRequestHandler',
        cname: '删除请求头信息'
    },
    //播放相关
    GET_CURRENT_TRACK: {
        name: 'app-currentTrack',
        cname: '获取当前播放Track信息',
    },
    GET_SPECTRUM_PARAMS: {
        name: 'app-sprectrumParams',
        cname: '获取频谱相关参数',
    },
}

const EVENT_REGISTER_PREFIX = 'event-register-'
const EVENT_UNREGISTER_PREFIX = 'event-unregister-'

const transformEvent = (event, prefix) => {
    const { name, cname } = event
    prefix = prefix || EVENT_REGISTER_PREFIX
    const cnamePrefix = stringEquals(prefix, EVENT_REGISTER_PREFIX) ? '监听事件：' : '取消监听事件：'
    return {
        name: `${prefix}${name}`,
        cname: `${cnamePrefix}${cname}`
    }
}

const recoverToEvent = (permission, prefix) => {
    const { name, cname } = permission
    prefix = prefix || EVENT_REGISTER_PREFIX
    return {
        name: name.replace(prefix, ''),
        cname,
    }
}

const PermissionsAccessRegistration = {}
const registerAccessPermissions = async (plugin, permission) => {
    tryCallDefault(() => {
        const { id } = plugin || {}
        if(!id) return 

        let permissions = PermissionsAccessRegistration[id] || []
        const index = permissions.findIndex(e => (e.name == permission.name))
        if(index < 0) permissions.push(permission)
        Object.assign(PermissionsAccessRegistration, {
            [id]: permissions
        })
    })
}

const revokePermissions = async (plugin) => {
    tryCallDefault(() => {
        const { id } = plugin || {}
        if(!id) return 

        const permissions = PermissionsAccessRegistration[id] || []
        permissions.forEach(permission => {
            const { name, options } = permission 
            if(stringEquals(APIPermissions.OPEN_DEV_TOOLS['name'], name)) {
                lessAPI.permissions.closeDevTools(plugin)
            } 
            else if(stringEquals(APIPermissions.ADD_REQUEST_HANDLER['name'], name)) {
                lessAPI.permissions.removeRequestHandler(plugin, options)
            } 
            else if(stringEquals(APIPermissions.REGISTER_PLATFORM['name'], name)) {
                lessAPI.permissions.unregisterPlatform(plugin, options)
            } 
            else if(stringPrefixEquals(name, EVENT_REGISTER_PREFIX)) {
                lessAPI.events.unregister(plugin, recoverToEvent(permission), options)
            }
        })
        Reflect.deleteProperty(PermissionsAccessRegistration, id)
    })
}

//事件处理器注册中心
const EventHandlerRegistrations = {
    mappings: {},
    handlers(event) { 
        const { name } = event
        return this.mappings[name]
    },
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
        //if (!Object.hasOwn(APIEvents, event)) return
        //支持类型：function、object
        if (!'object|function'.includes(typeof handler)) return
        if (Array.isArray(handler)) return
        
        const { name } = event
        this.mappings[name] = this.mappings[name] || []
        const index = this.mappings[name].findIndex(item => (item == handler))
        if (index > -1) this.mappings[name].splice(index, 1)
        this.mappings[name].push(handler)
    },
    unregister(event, handler) {
        if (!event || !handler) return
        //if (!Object.hasOwn(APIEvents, event)) return

        const { name } = event
        const handlers = this.mappings[name]
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
            if (handlers.length < 1) Reflect.deleteProperty(this.mappings, name)
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
    //取消权限
    revokePermissions(plugin)
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

const onPluginOptionsUpdated = (id, options) => {
    const plugin = getPlugin(id)
    if (!plugin) return
    const { path, main, mainModule } = plugin
    if (!path || !main) return 
    if (!mainModule || !mainModule.optionsUpdated) {
        import(/* @vite-ignore */ `${FILE_PREFIX}${path}/${main}`).then(mainModule => {
            Object.assign(plugin, { mainModule })
            tryCallDefault(mainModule.optionsUpdated, plugin)
        }).catch(error => {
            console.log(error)
        })
    } else {
        tryCallDefault(mainModule.optionsUpdated, plugin)
    }
}

//异步加载插件
const loadPluginsOnStartup = async () => {
    if (plugins.value.length < 1) return
    if (isDevEnv()) console.log('[ STARTUP - plugins ] 加载插件中......')
    //TODO 当前实现方式，不好确定全部加载完成的时机，以进行相关回调
    plugins.value.forEach((plugin, index) => {
        const { state } = plugin
        if (state != ActivateState.ACTIVATED) return
        activatePluginNow(plugin, null, (plugin) => {
            updatePlugin(plugin, { state: ActivateState.INVALID })
        })
    })
}

const accessPermission = async (plugin, permission, options, action) => {
    if(!plugin || !plugin.id) return console.log('[Plugin Invalid] ' + plugin)

    registerAccessPermissions(plugin, { ...permission, options })
    try {
        if(typeof action != 'function') return
        return isAsyncFn(action) ? await action() : action()
    } catch(error) {
        console.log(error)
    }
}

const accessIpcRendererSend = async (plugin, permission, options) => {
    const { name } = permission || {}
    if(!name) return 
    return accessPermission(plugin, permission, options,
        () => ipcRendererSend(name, options))
}

const accessIpcRendererInvoke = async (plugin, permission, options) => {
    const { name } = permission || {}
    if(!name) return 
    return accessPermission(plugin, permission, options, 
        async () => (await ipcRendererInvoke(name, options) || '')
    )
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
        escapeHtml,
        transformUrl,
        parseXML, 
        buildXML,
        tify,
        sify,
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
        encodeLess,
        decodeLess,
        rsaEncrypt,
        rsaEncryptDefault,
        base64Stringify,
        base64Parse,
        hexDecode,
        //aesDecryptDefault,
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
        register(plugin, event, handler) {
            const permission = { ...transformEvent(event) }
            accessPermission(plugin, permission, handler, () => {
                EventHandlerRegistrations.register(event, handler)
            })
        },
        unregister(plugin, event, handler) {
            const permission = { ...transformEvent(event, EVENT_UNREGISTER_PREFIX) }
            accessPermission(plugin, permission, handler, () => {
                EventHandlerRegistrations.unregister(event, handler)
            })
        },
    },
    permissions: {
        openDevTools(plugin) {
            accessIpcRendererSend(plugin, APIPermissions.OPEN_DEV_TOOLS)
        },
        closeDevTools(plugin) {
            accessIpcRendererSend(plugin, APIPermissions.CLOSE_DEV_TOOLS)
        },
        //获取相关信息
        async getUserAgent(plugin) {
            return await accessIpcRendererInvoke(plugin, APIPermissions.GET_USER_AGENT)
        },
        async getCookie(plugin, url, fetchOnMissing) {
            return await accessIpcRendererInvoke(plugin, APIPermissions.GET_COOKIE, { url, fetchOnMissing })
        },
        //请求头信息 - 设置、更新、删除
        addRequestHandler(plugin, handler) {
            accessIpcRendererInvoke(plugin, APIPermissions.ADD_REQUEST_HANDLER, handler)
        },
        updateRequestHandler(plugin, handler) {
            accessIpcRendererInvoke(plugin, APIPermissions.UPDATE_REQUEST_HANDLER, handler)
        },
        removeRequestHandler(plugin, handler) {
            accessIpcRendererInvoke(plugin, APIPermissions.REMOVE_REQUEST_HANDLER, handler)
        },
        //自定义平台
        registerPlatform(plugin, platform) {
            accessPermission(plugin, APIPermissions.REGISTER_PLATFORM, platform, 
                () => {
                    addPlatform(platform)
                    emitEvents(`plugins-registerPlatform`, platform)
                }
            )
        },
        unregisterPlatform(plugin, platform) {
            accessPermission(plugin, APIPermissions.UNREGISTER_PLATFORM, platform, 
                () => removePlatform(platform)
            )
        },
        //路由
        registerRoute(plugin, route) {
            accessPermission(plugin, APIPermissions.ADD_ROUTE, route, 
                () => (addCustomRoute(route))
            )
        },
        visitRoute(plugin, route) {
            accessPermission(plugin, APIPermissions.VISIT_ROUTE, route, 
                () => (visitCommonRoute(route))
            )
        },
        //播放相关
        getCurrentTrack(plugin) {
            return accessPermission(plugin, APIPermissions.GET_CURRENT_TRACK, null, 
                () => {
                    const { 
                        id, platform, title, cover, artist, album, duration
                    } = toRaw(currentTrack.value || {})
                    return { 
                        id, platform, title, 
                        cover, artist, album, 
                        duration 
                    }
                }
            )
        },
        async getSpectrumParams(plugin) {
            return await accessPermission(plugin, APIPermissions.GET_SPECTRUM_PARAMS, null, 
                () => (toRaw(spectrumParams.value))
            )
            
        },
    },
    renderers: {
        h,
    }
}

window.lessAPI = {}
const exposeAPI = (apis) => {
    //允许在运行期间动态暴露API
    //存在明显的安全隐患，但暂时简单实现
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
    onPluginOptionsUpdated,
    hasExDrawSpectrumHandlers: () => {
        return EventHandlerRegistrations.hasHanlders(APIEvents.TRACK_DRAW_SPECTRUM)
    },
    getExVisualCanvasHandlersLength: () => {
        const handlers = EventHandlerRegistrations.handlers(APIEvents.TRACK_VISUAL_CANVAS) || []
        return handlers.length
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
    APIPermissions,
    PermissionsAccessRegistration,
})
</script>

<template>
    <slot></slot>
</template>

<style>
</style>