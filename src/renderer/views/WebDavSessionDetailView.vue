<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'WebDavSessionDetailView'
}
</script>

<script setup>
import { computed, inject, onMounted, reactive, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { useCloudStorageStore } from '../store/cloudStorageStore';
import { isDevEnv, ipcRendererInvoke, isSupportedAudio, isSupportedVideo,
    md5, guessFilename, toYyyymmdd, extractHhMm, 
    toLowerCaseTrimString, isBlank, } from "../../common/Utils";
import { WebDav } from '../../vendor/webdav';
import { Playlist } from '../../common/Playlist';
import SearchBarExclusiveModeControl from '../components/SearchBarExclusiveModeControl.vue';



const props = defineProps({
    id: String
})

const { backward } = inject('appRoute')
const { showConfirm } = inject('apiExpose')
const { addAndPlayTracks, playVideoItem, dndSaveFile } = inject('player')


const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { isDndSaveEnable } = storeToRefs(useSettingStore())
const { playTrack, resetQueue, addTracks, playNextTrack, addTrack, playTrackLater } = usePlayStore()
//const { webdavSessions } = storeToRefs(useCloudStorageStore())
const { getWebDavSession, } = useCloudStorageStore()


const davData = reactive([])
const currentSession = ref(null)
const currentPath = ref(null)
const loading = ref(false)
const viewMode = ref(0)
const keyword = ref(null)
const filteredData = ref(null)
const listContentRef = ref(null)
const gridContentRef = ref(null)
const setViewMode = (value) => (viewMode.value = value)
const setLoading = (value) => (loading.value = value)
const setKeyword = (value) => (keyword.value = value)
const setFilteredData = (value) => (filteredData.value = value)


let client = null
const visitRoot = async () => {
    if(!props.id) return
    setLoading(true)
    currentSession.value = getWebDavSession(props.id, true) || { title: 'WebDAV会话' }
    client = WebDav.createClient(currentSession.value)
    if(client) changeDirectory('/')
}

const resetScrollState = () => {
    if(listContentRef.value) listContentRef.value.scrollTop = 0
    if(gridContentRef.value) gridContentRef.value.scrollTop = 0
}

const changeDirectory = async (path, options) => {
    currentPath.value = path
    setLoading(true)
    resetScrollState()
    resetFilter()
    WebDav.ls(client, path, options).then(directoryItems => {
        davData.length = 0

        if(directoryItems && directoryItems.length > 0) {
            directoryItems.sort((a, b) => {
                const { basename: n1, type: t1 } = a
                const { basename: n2, type: t2 } = b
                if(t1 < t2) return -1
                return toLowerCaseTrimString(n1) < toLowerCaseTrimString(n2)
            })
            davData.push(...directoryItems)
            setLoading(false)
        }
    })
}


const onScroll = () => {
    hideAllCtxMenus()
}

const computedSize = computed(() => {
    return (size) => {
        if(!size) return ''
        let unit = 'KB', _size = 0
        _size = size / 1024
        if(_size > 1000) {
            _size /= 1024
            unit = 'MB'
        }
        return `${_size.toFixed(2)}${unit}`
    }
})

const computedType = computed(() => {
    return (type) => ({
        file: 'File',
        directory: 'Folder',
    }[type])
})

const computedIconType = computed(() => {
    return (item, refType) => {
        const { filename, type } = item
        let _type = 'file'
        if(type == 'directory') {
            _type = type
        } else if(isSupportedAudio(filename)) {
            _type = 'audio'
        } else if(isSupportedVideo(filename)) {
            _type = 'video'
        }
        return _type == refType
    }
})

const computedItemActionShow = computed(() => {
    return (item) => {
        const { filename, type } = item
        if(type == 'directory') {
           return true
        } else if(isSupportedAudio(filename)) {
            return true
        } else if(isSupportedVideo(filename)) {
            return true
        }
        return false
    }
})

const getFileUrl = (filename) => {
    if(!filename || !currentSession.value) return 
    const { url } = currentSession.value
    return `${url}${filename.substring(1)}` 
}

const toTrack = (item) => {
    const { filename, type } = item
    const url = getFileUrl(filename)

    return {
        id: md5(url),
        platform: WebDav.CODE,
        title: guessFilename(filename),
        cover: '',
        duration: 0,
        url,
        type: Playlist.NORMAL_TYPE,
    }
}

const toVideoItem = (item) => {
    const { filename, type } = item
    const url = getFileUrl(filename)
    return {
        id: md5(url),
        platform: WebDav.CODE,
        title: guessFilename(filename),
        cover: '',
        duration: 0,
        url,
        type: Playlist.VIDEO_TYPE,
        vcType: 0,
    }
}

const parseTracks = (data) => {
    if(!data || data.length < 1) return []

    const tracks = []
    data.forEach(item => {
        const { filename, type } = item
        const isDirectory = (type == 'directory')
        if(isDirectory || !isSupportedAudio(filename)) return
        tracks.push(toTrack(item))
    })
    return tracks
}

const doPlayItem = (item)=> {
    if(!item) return
    const { filename, type, } = item
    if(type == 'directory') return 

    const url = getFileUrl(filename)
    if(isSupportedAudio(filename)) {
        showToast('即将为您播放当前歌曲')
        playTrack(toTrack(item))
    } else if(isSupportedVideo(filename)) {
        playVideoItem(toVideoItem(item))
    }
}

const visitItem = async (item, index, isDoubleClick) => {
    const { filename, type, } = item
    const isDirectory = (type == 'directory')

    if(isDirectory) return changeDirectory(filename)
    if(isDoubleClick) return doPlayItem(item)
}

const visitParent = async () => {
    if(!currentPath.value) return 
    let path = currentPath.value
    if(path.endsWith('/')) path = path.substring(0, path.length - 2)
    const index = path.lastIndexOf('/')
    if(index < 0) return 
    const parentPath = index > 0 ? path.substring(0, index) : '/'
    if(!parentPath) return 
    changeDirectory(parentPath)
}


const playDirectory = async (data) => {
    const _data = data || davData
    if(!_data || _data.length < 1) return

    const tracks = parseTracks(_data) || []
    if(!tracks || tracks.length < 1) return showFailToast('没有找到可播放歌曲') 

    addAndPlayTracks(tracks, true, '即将为您播放当前目录')
}

const addDirectoryToPlaylist = async (data, text) => {
    const _data = data || davData
    if(!_data || _data.length < 1) return

    const tracks = parseTracks(_data) || []
    if(!tracks || tracks.length < 1) return showFailToast('没有找到可播放歌曲')  

    addTracks(tracks)
    showToast(text || '当前目录歌曲已添加')
}

const closeSession = async () => {
    const ok = await showConfirm('确定关闭当前会话吗')
    if(!ok) return

    backward()
    changeDirectory('/')
}

const playItem = async (item) => {
    const { filename, type, } = item
    const isDirectory = (type == 'directory')
    if(isDirectory) {
        WebDav.ls(client, filename).then(directoryItems => {
            playDirectory(directoryItems)
        })
        return 
    }
    doPlayItem(item)
}

const addItem = async (item) => {
    const { filename, type, } = item
    const isDirectory = (type == 'directory')
    if(isDirectory) {
        WebDav.ls(client, filename).then(directoryItems => {
            addDirectoryToPlaylist(directoryItems)
        })
        return 
    }
    if(isSupportedVideo(filename)) return showFailToast('当前操作暂不支持')
    
    if(isSupportedAudio(filename)) {
        addTrack(toTrack(item))
        showToast('当前歌曲已添加')
    }
}

const playItemLater = async (item) => {
    const { filename, type, } = item
    const isDirectory = (type == 'directory')
    if(isDirectory) return showFailToast('当前操作暂不支持')
    if(isSupportedVideo(filename)) return showFailToast('当前操作暂不支持')

    if(isSupportedAudio(filename)) {
        playTrackLater(toTrack(item))
        showToast('下一曲播放已添加')
    }
}

const saveItemToLocal = async (event, item) => {
    const { filename, type, basename } = item
    const isDirectory = (type == 'directory')
    if(isDirectory) return 
    //if(isDirectory) return showFailToast('暂不支持下载目录')
    
    dndSaveFile(event, {
        title: basename,
        url: getFileUrl(filename)
    })
}

const switchViewMode = () => {
    const mode = viewMode.value
    setViewMode((mode + 1) % 2)
}

const resetFilter = () => {
    setKeyword(null)
    setFilteredData(null)
}

const filterContent = (keyword) => {
    setKeyword(keyword)
    if(isBlank(keyword)) return resetFilter()
    if(davData.length < 1) return

    const _keyword = toLowerCaseTrimString(keyword)
    const list = davData.filter(item => {
        const { basename } = item
        const title = toLowerCaseTrimString(basename)
        return title.includes(_keyword)
    }) || []
    setFilteredData(list)
}

const computedDavData = computed(() => {
    return filteredData.value || davData
})

const computedDavDataLength = computed(() => {
    const total = davData.length
    const filtered = computedDavData.value.length
    return filtered == total ? total : `${filtered}/${total}`
})

/* 生命周期、监听 */
onMounted(visitRoot)
</script>

<template>
    <div id="webdav-session-detail-view" @scroll="onScroll" >
        <div class="header">
            <div class="title-wrap">
                <div class="title" v-html="currentSession.title || 'WebDAV会话'"></div>
                <div class="options to-right">
                    <SearchBarExclusiveModeControl class="spacing" :checked="true"
                        :onKeywordChanged="(keyword)  => filterContent(keyword)">
                    </SearchBarExclusiveModeControl>
                </div>
            </div>
        </div>
        <div class="tip-text about" v-show="false">
            <p>郑重声明: 当前应用无法保证账号信息安全；当涉及隐私信息时，不建议使用此项WebDAV</p>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight" 
                    @click="switchViewMode" 
                    v-show="!loading">
                    <svg v-show="viewMode == 0" width="17" height="17" viewBox="0 0 682.31 511.62" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M341.27,84.78q-148.21,0-296.43,0c-20,0-35.34-10-41.87-27.24A42.42,42.42,0,0,1,41,.07C42.31,0,43.64,0,45,0H637.34C658,0,674.12,11,680.06,29c9.25,28-11.11,55.68-41.35,55.71q-134.48.15-268.94,0Z"/><path d="M341.19,426.84q148.21,0,296.43,0c20.07,0,35.29,10,41.84,27.26a42.41,42.41,0,0,1-38,57.44c-1.5.07-3,.07-4.5.07H45.56c-20.48,0-36.15-10.18-42.71-27.65-10.27-27.36,9.59-56.91,38.91-57,71-.26,142-.11,213-.12Z"/><path d="M341.15,213.42q147,0,293.92.11a62.77,62.77,0,0,1,19.61,2.76c18.5,6.26,29.77,25.53,27.27,45.07a42.23,42.23,0,0,1-38.51,36.53c-2.49.19-5,.3-7.48.3q-294.68,0-589.35.07c-13.06,0-24.83-3-34.06-12.63C.24,272.76-3.2,257.49,3.05,240.9c6.17-16.38,18.6-25.51,36.19-27.18,3.14-.29,6.32-.29,9.49-.29Z"/></g></g></svg>
                    <svg v-show="viewMode == 1" width="17" height="17" viewBox="0 0 1012.01 1012.01" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M463.17,779.5q0,86.24,0,172.48c0,30.17-17.3,52.23-45.79,58.47A68.61,68.61,0,0,1,403,1012q-171.22.12-342.46,0C24.93,1012,0,987.15,0,951.66Q0,780.44,0,609.2c0-35.78,24.51-60.33,60.35-60.34q171.48-.06,343,0c31,0,54.08,19,59.16,48.72a69.39,69.39,0,0,1,.67,11.45Q463.21,694.27,463.17,779.5ZM346.64,895.22V665.36H116.5V895.22Z"/><path d="M780.16,463.18h-170c-37.47,0-61.36-23.78-61.36-61.11V60.14c0-35.52,24.5-59.95,60-60L951.31,0c35.9,0,60.69,24.7,60.69,60.53q0,171.21,0,342.43c0,35.68-24.56,60.19-60.38,60.2Q865.9,463.2,780.16,463.18ZM665.28,116.45V346.39H895.52V116.45Z"/><path d="M779.48,548.84q86.25,0,172.5,0c30.17,0,52.23,17.29,58.47,45.79a67.85,67.85,0,0,1,1.49,14.36q.12,171.75,0,343.49c0,33.5-23.79,58.1-57.31,59.45-1.33.06-2.66.06-4,.06q-171,0-342,0c-29.31,0-51.5-16.91-58.09-44.47a66.9,66.9,0,0,1-1.7-15.33q-.13-172,0-344c0-30.62,19-53.48,48.68-58.68a66.21,66.21,0,0,1,11.45-.66Q694.24,548.81,779.48,548.84ZM895.61,665.33H665.29v230H895.61Z"/><path d="M463.17,231.51q0,85.74,0,171.49c0,35-23.06,59-57.88,60-12.16.35-24.33.19-36.49.19q-154.5,0-309,0c-29.73,0-52.19-17.51-58.28-45.46A65.94,65.94,0,0,1,.07,403.83q-.12-172,0-344C0,25,25.1,0,60,0Q231.5,0,403,0C438.5,0,463.1,24.5,463.15,60Q463.27,145.76,463.17,231.51ZM116.45,346.65H346.69V116.49H116.45Z"/></g></g></svg>
                    <span>列表({{ computedDavDataLength }})</span>
                </div>
                <div class="size-text loading-mask" v-if="loading" 
                    style="width: 128px; height: 26px; display: inline-block;">
                </div>
                <div class="action to-right">
                    <SvgTextButton text="播放目录" 
                        :leftAction="playDirectory" 
                        :rightAction="addDirectoryToPlaylist" 
                        class="spacing">
                        <template #left-img>
                            <svg width="15" height="15" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                        </template>
                        <template #right-img>
                            <svg width="17" height="17" viewBox="0 0 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z" />
                                        <path
                                            d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z" />
                                        <path
                                            d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z" />
                                        <path
                                            d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z" />
                                    </g>
                                </g>
                            </svg>
                        </template>
                    </SvgTextButton>
                    <SvgTextButton text="退出会话" :leftAction="closeSession" class="spacing" v-if="false">
                        <template #left-img>
                            <svg width="16" height="16" viewBox="0 0 770.66 779.07" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M389.25,779.07c-159.7-.12-300.57-94.26-359.94-238C7.08,487.28-2.83,431.21.7,373.16Q9.58,226.89,112.39,121.9c14.86-15.19,37.84-15.85,52.51-1.76,15.21,14.6,15.7,37.7.44,53.21-35.93,36.52-63,78.61-77,127.91-34.1,120.26-7.39,226.16,80.06,315.33,46.87,47.81,105.26,75.33,171.47,85.2,159.1,23.71,311.08-77.86,347.77-234.45,25.78-110.07-1.77-207.32-78.77-290.26-7.43-8-14-16-14.64-27.5-.94-15.85,7.21-29.93,21.3-36.46a36.48,36.48,0,0,1,41.55,7.42,380.44,380.44,0,0,1,63.25,82.7C746,248.55,762.2,297.09,768,348.84c9.89,88.24-7.81,170.78-54.37,246.44C665.82,673,598.21,726.86,512.25,757.5A374.22,374.22,0,0,1,389.25,779.07Z" />
                                        <path
                                            d="M422.07,208.11q0,85.26,0,170.5c0,17.27-8.62,30.59-23.1,36.4-24.65,9.89-50.71-7.94-50.7-34.91q0-129.75.29-259.5c0-27.33,0-54.66.19-82,.13-19.32,11.62-33.89,29.35-37.76C400.45-4,422.25,12.64,422.46,35.62c.36,37.83,0,75.67,0,113.5q0,29.49,0,59Z" />
                                    </g>
                                </g>
                            </svg>
                        </template>
                    </SvgTextButton>
                    <SvgTextButton text="返回上级" :leftAction="visitParent" :rightAction="closeSession" class="spacing">
                        <template #left-img>
                            <svg width="14" height="14" viewBox="0 0 768.28 768.14" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M146.53,300.67a36.83,36.83,0,0,1,4.84,3.5q66.51,66.42,133,132.87c11.88,11.85,17.26,25.67,13.29,42.19-3.85,16-14.08,26.67-30,31.14-15.73,4.42-29.81.58-41.42-10.81-19.74-19.38-39.17-39.08-58.74-58.63Q90.22,363.73,12.92,286.53c-17-17-17.33-43.54-.37-60.53Q119.08,119.33,225.84,12.91c17.08-17,43.44-17.17,60.22-.67a42.18,42.18,0,0,1,.34,60.55q-67.26,67.78-135,135.12a44,44,0,0,1-4.79,3.6l.8,1.8h6.08q199.25,0,398.48,0c62.3.06,115.51,22.2,158.44,67.54,31.52,33.28,50.2,73,55.87,118.56a257.16,257.16,0,0,1,1.9,31.39q.19,146.74.06,293.49c0,22.41-14.58,39.53-36.56,43.28-23.29,4-46.82-14.5-48.46-38.06-.21-3-.21-6-.21-9,0-97.16.38-194.33-.16-291.49-.3-54.29-25.55-94-74.15-118.42-16.93-8.48-35.22-11.85-54.17-11.85q-201.49,0-403,0c-1.29,0-2.58.13-3.87.2C147.3,299.56,146.91,300.11,146.53,300.67Z"/></g></g></svg>
                        </template>
                        <template #right-img>
                            <svg width="14" height="14" viewBox="0 0 864.07 864.08" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,431.78q0-159.48,0-319C.1,58.93,36.21,14.05,88.83,2.56A108.47,108.47,0,0,1,111.62.12Q271.36-.1,431.08,0c25.53,0,45.28,17.47,48.67,42.61,3.07,22.74-12.14,45.32-35.12,51.5a61,61,0,0,1-15.79,1.79q-156.48.15-313,.08C101.55,96,96,101.58,96,116V748.45c0,13.92,5.69,19.56,19.81,19.56q157.23,0,314.46,0c27.06,0,48.43,19.58,49.65,45.33A47.9,47.9,0,0,1,432.12,864c-38.16.21-76.32.06-114.48.06-68.83,0-137.65.18-206.48-.08a111.54,111.54,0,0,1-104.48-74A116.85,116.85,0,0,1,0,749.74Q.08,590.77,0,431.78Z"/><path d="M698.86,480H242.1c-25.24,0-45.19-16.08-49.22-39.57-5.09-29.68,17-56.24,47.22-56.37,46.33-.19,92.66-.06,139-.06H699.85c-1.88-2-3-3.35-4.27-4.59-24.26-24.29-48.64-48.47-72.76-72.89-23-23.32-18.41-60.07,9.33-76.1,19.11-11.05,42.16-7.79,58.65,8.57q32,31.68,63.66,63.6,47.19,47.2,94.36,94.42c18.22,18.33,20.26,44.33,5.31,64a63.86,63.86,0,0,1-5.65,6.33Q769.85,546,691.15,624.67c-23.66,23.6-60.57,19.2-76.78-8.92-10.9-18.92-7.68-42,8.43-58.27q36.27-36.56,72.78-72.87c1.18-1.17,2.47-2.22,3.71-3.33C699.14,480.86,699,480.44,698.86,480Z"/></g></g></svg>
                        </template>
                    </SvgTextButton>
                </div>
            </div>
            <div class="location">
                <span>当前目录:</span>
                <span class="current" v-html="currentPath"></span>
            </div>
            <div class="content list-view" ref="listContentRef" v-show="viewMode == 0 && !loading">
                <div v-for="(item, index) in computedDavData" 
                    v-show="computedDavData.length > 0"
                    class="item"
                    @click="visitItem(item, index, false)"
                    @dblclick="visitItem(item, index, true)"
                    :draggable="isDndSaveEnable" 
                    @dragstart="event => saveItemToLocal(event, item)">
                    <div class="sqno" v-html="(index + 1)" v-if="false"></div>
                    <div class="icon">
                        <svg width="24" height="24" v-show="computedIconType(item, 'directory')" viewBox="0 0 860.8 725.41" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M393.29,725.2c-76.16,0-152.33.57-228.49-.17-75-.72-143.69-57.12-159.74-130.39a205.79,205.79,0,0,1-4.81-43Q-.27,340.84.06,130.1C.08,67.17,41.46,15.7,102.57,2.82A135.87,135.87,0,0,1,129.36.2q57.49-.4,115-.08C292.12.32,333.1,17.26,367,51c15.48,15.4,30.67,31.09,45.71,46.9,9.91,10.42,21.69,15.3,36.06,15.26,57.16-.14,114.33-.4,171.49.09,79,.68,149.25,60.27,163.47,137.92.66,3.6,1.92,7.27,1.66,10.82-.58,7.71,3.65,10.5,9.94,13.58,55.2,27,79.78,90.53,57.07,148.18-25.6,65-51.09,130.1-78,194.6-25,59.91-70.68,94.85-134.73,105.41-8.65,1.43-17.59,1.54-26.4,1.56q-110,.16-220,.06ZM129.5,629.32a83.93,83.93,0,0,0,41.89,10.77q222,0,444-.11a86.62,86.62,0,0,0,21.23-2.55c28.8-7.39,48.55-25.34,59.59-52.86q38.14-95.19,76-190.49a38,38,0,0,0,2.82-17c-1.67-17.59-14.88-28.1-33.9-28.1h-486c-23.66,0-38.13,10.5-45.4,32.9Q176,486.11,142.09,590.29C137.89,603.23,133.73,616.19,129.5,629.32ZM85.55,484.6l1,.23c.45-1.35.91-2.71,1.35-4.07,13.54-41.6,27.75-83,40.44-124.85,16.24-53.52,65.95-92.79,127.53-92.48,145.31.71,290.62.23,435.94.23h7.35c-.81-2.75-1.31-4.65-1.92-6.51-11.63-35.46-44.19-58.79-82.45-58.85-57.16-.1-114.32.22-171.48-.18-34.21-.23-63.62-13.06-87.92-37-16.25-16-32-32.58-47.9-49-17.55-18.06-39-26.76-64-26.78q-56,0-112,0c-28.17,0-45.93,17.72-45.94,45.84q0,174.23,0,348.45Z"/></g></g></svg>
                        <svg width="25" height="25" v-show="computedIconType(item, 'file')" viewBox="0 0 768.18 938.56" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M.14,469.14C.14,356-.27,242.84.32,129.69c.28-55.24,26.62-95,76.42-118.85C93.34,2.89,111.21,0,129.63,0q132,.12,264,0Q442.64,0,479.74,31.77,601.2,135.86,722.58,240c30.31,26,45.5,59.38,45.53,99.31q.15,235,0,469.93c0,64.35-44.08,116.67-107.45,127.64a135.66,135.66,0,0,1-22.89,1.58q-253.72.13-507.44,0C66.9,938.5,15.58,897.24,2.8,835.88A133.48,133.48,0,0,1,.25,809.1Q0,639.12.14,469.14Zm384-383.85H131.21c-27.72,0-45.8,17.92-45.8,45.55q0,338.7,0,677.4c0,26.94,18.27,45,45.3,45q253.21,0,506.43,0c27.7,0,45.73-17.94,45.74-45.61q0-230.46,0-460.93v-5.45h-6.84q-80.47,0-161-.06a143,143,0,0,1-21.42-1.32c-63.83-9.83-109.3-62.81-109.5-127.41-.09-30,0-60,0-90Zm85.25,50v5.84c0,23.33-.08,46.66,0,70,.1,26.65,18.29,44.77,45,44.86,30,.1,60,0,90,0,1.4,0,2.8-.19,5.34-.38Z"/></g></g></svg>
                        <svg width="25" height="25" v-show="computedIconType(item, 'audio')" viewBox="0 0 768.18 938.56" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M.14,469.14C.14,356-.27,242.84.32,129.69c.28-55.24,26.62-95,76.42-118.85C93.34,2.89,111.21,0,129.63,0q132,.12,264,0Q442.64,0,479.74,31.77,601.2,135.86,722.58,240c30.31,26,45.5,59.38,45.53,99.31q.15,235,0,469.93c0,64.35-44.08,116.67-107.45,127.64a135.66,135.66,0,0,1-22.89,1.58q-253.72.13-507.44,0C66.9,938.5,15.58,897.24,2.8,835.88A133.48,133.48,0,0,1,.25,809.1Q0,639.12.14,469.14Zm384-383.85H131.21c-27.72,0-45.8,17.92-45.8,45.55q0,338.7,0,677.4c0,26.94,18.27,45,45.3,45q253.21,0,506.43,0c27.7,0,45.73-17.94,45.74-45.61q0-230.46,0-460.93v-5.45h-6.84q-80.47,0-161-.06a143,143,0,0,1-21.42-1.32c-63.83-9.83-109.3-62.81-109.5-127.41-.09-30,0-60,0-90Zm85.25,50v5.84c0,23.33-.08,46.66,0,70,.1,26.65,18.29,44.77,45,44.86,30,.1,60,0,90,0,1.4,0,2.8-.19,5.34-.38Z"/><path d="M463.81,504.23v5.94q0,84.23,0,168.47c0,40.65-17.05,73.53-47.36,99.48-27.82,23.82-60.65,33.81-97.27,31.56-12.44-.77-25,.14-37.38-1.23-55.41-6.11-104.63-53.76-114-108.9-2.69-15.82,1.67-30.13,7.07-44.22,20.76-54.15,74.77-88.9,132.71-85.75,12.46.68,25,1.22,37.29,3.19,12.07,1.94,23.85,5.62,36.18,8.64v-4.53q0-97.47,0-195c0-20.08,10.45-35.85,27.88-41.85s36.12.26,48.21,16.11q45.78,60,91.49,120c19.8,26,7.56,61.23-23.83,67.67-15.53,3.18-29.14-1.5-39.56-13.63-5.85-6.82-10.95-14.27-16.39-21.44l-3.82-5Zm-143.7,222.3c13.93-.71,28.37-3.95,41.09-12.13a64.87,64.87,0,0,0,15.32-14c5.75-7.21,5.7-14.95-.25-22-4.51-5.35-10-10.45-16.12-13.76-24.56-13.3-50.45-14.38-76.84-6.12-10.61,3.32-20.25,8.5-27.69,17.07-7.78,9-8,18.46-.22,27.44a53.52,53.52,0,0,0,10,9C281.53,723.11,300,725.87,320.11,726.53Z"/></g></g></svg>
                        <svg width="25" height="25" v-show="computedIconType(item, 'video')" viewBox="0 0 768.18 938.56" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M.14,469.14C.14,356-.27,242.84.32,129.69c.28-55.24,26.62-95,76.42-118.85C93.34,2.89,111.21,0,129.63,0q132,.12,264,0Q442.64,0,479.73,31.77,601.2,135.86,722.58,240c30.31,26,45.5,59.38,45.53,99.31q.15,235,0,469.93c0,64.35-44.08,116.67-107.45,127.64a135.66,135.66,0,0,1-22.89,1.58q-253.72.13-507.44,0C66.9,938.5,15.58,897.24,2.81,835.88A132.76,132.76,0,0,1,.25,809.1Q0,639.12.14,469.14Zm384-383.85H131.25c-27.95,0-45.85,17.94-45.85,46q0,338.2,0,676.4c0,27.59,18.09,45.59,45.77,45.59H637.1c27.73,0,45.77-17.92,45.77-45.57q0-230.46,0-460.93v-5.49H676.1c-53.66,0-107.32.09-161-.09a167,167,0,0,1-25.36-2C435.34,330.66,389.9,282.8,385.3,228c-1.78-21.19-1-42.61-1.12-63.93C384,138.06,384.14,112.07,384.14,85.29ZM609.08,255,470.15,136a9.49,9.49,0,0,0-.68,1.77c0,25.5-.51,51,.13,76.49.59,23.18,17.28,40.75,40.45,41.42,32.63.94,65.31.25,98,.24C608.14,255.89,608.26,255.71,609.08,255Z"/><path d="M213.4,575.28q0-73.49,0-147c0-22.11,13.66-39.32,34.54-43.5,11.44-2.29,22,.36,32,6.27q62.43,36.66,125.06,73l127.68,74.47c11.75,6.86,19.25,16.87,21.38,30.38,2.91,18.48-5,34.72-21.29,44.31q-47.16,27.69-94.44,55.15C386.21,698.85,334,729.17,281.87,759.82c-14,8.22-28.2,11.25-43.24,4.25-16.92-7.87-25.14-21.81-25.19-40.32C213.32,674.26,213.4,624.77,213.4,575.28Zm214.09.67-128.24-74.8V650.77Z"/></g></g></svg>
                    </div>
                    <div class="title">
                        <span v-html="item.basename"></span>
                        <div class="action" v-show="computedItemActionShow(item)">
                            <svg @click.stop="playItem(item)" width="18" height="18" class="play-btn" viewBox="0 0 139 139" xml:space="preserve"
                                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                            <svg @click.stop="playItemLater(item)" width="18" height="18" class="play-later-btn spacing" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z" />
                                        <path
                                            d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z" />
                                    </g>
                                </g>
                            </svg>
                            <svg @click.stop="addItem(item)" width="16" height="16" class="add-btn spacing" viewBox="0 0 682.65 682.74"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                    </div>
                    <div class="size" v-html="computedSize(item.size)"></div>
                    <div class="type" v-if="false" v-html="computedType(item.type)"></div>
                    <div class="updated">
                        <span class="hms">{{ extractHhMm(item.lastmod) }}</span>
                        <span>{{ toYyyymmdd(item.lastmod) }}</span>
                    </div>
                </div>
            </div>
            <div class="content grid-view" ref="gridContentRef" v-show="viewMode == 1 && !loading">
                <div v-for="(item, index) in computedDavData" 
                    v-show="computedDavData.length > 0"
                    class="item"
                    @click="visitItem(item, index, false)"
                    @dblclick="visitItem(item, index, true)"
                    :draggable="isDndSaveEnable" 
                    @dragstart="event => saveItemToLocal(event, item)">
                    <div class="icon">
                        <svg width="63" height="63" v-show="computedIconType(item, 'directory')" viewBox="0 0 867.65 656.04" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M752,224.05c20.14,0,39.62-.29,59.09.07,23.86.45,41.33,11.58,51.54,33.19,6.31,13.38,6.42,27.38,1.75,41.39Q807.82,468.43,751.21,638.14C747.14,650.33,739,656,726,656H24.54C10.22,656,0,645.85,0,631.58Q0,344.84,0,58.09C0,24.3,24.23.07,58,.05Q162.45,0,267,0a60.56,60.56,0,0,1,37.63,12.52c35,26.33,70.18,52.47,105.17,78.84a22.1,22.1,0,0,0,14.17,4.78q135.26-.21,270.5-.08c27.66,0,49.55,16.85,55.89,43.06A65.88,65.88,0,0,1,751.93,154c.17,21.33.07,42.67.07,64ZM710.64,607.9c.54-1.54,1.05-2.94,1.52-4.35L798,346.08q10.17-30.52,20.31-61.07c2.83-8.53-.27-12.91-9.08-13H179.3c-9,0-10.18.85-13,9.19Q112.72,441.91,59.11,602.6c-.55,1.65-.9,3.36-1.42,5.3ZM48,481.37l.84.17c.42-1.21.85-2.41,1.26-3.63q35.34-105.8,70.69-211.58c9.52-28.51,28.67-42.29,58.72-42.29H704c0-23.31,0-45.95,0-68.59,0-9.14-2.3-11.41-11.56-11.41q-135,0-270,.08a64.37,64.37,0,0,1-40.34-13.48C347.19,104.24,312,78.13,277,51.8A17.9,17.9,0,0,0,265.53,48Q162.8,48.12,60.06,48C50.1,48,48,50.11,48,60V481.37Z"/></g></g></svg>
                        <svg width="63" height="63" v-show="computedIconType(item, 'file')" viewBox="0 0 628 832.57" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,810.34V22.29C7,3.57,12.06.12,32.59.12Q234.72.12,436.84,0c11.64,0,20.73,3.8,28.87,12Q538.4,85.26,611.52,158.06c7.13,7.11,14.15,14,16.48,24.24v628a7.05,7.05,0,0,0-.85,1.69c-2.74,13.51-9.89,19.66-23.73,20.33-2.32.11-4.66.14-7,.14H145.52c-39,0-78-.13-117,.06C11.71,832.65,2,825.18.63,811.05.61,810.79.22,810.58,0,810.34Zm48.05-25.53H579.79v-567H573l-135.48.33c-9.23,0-18.21-1.65-23-10.22A37.76,37.76,0,0,1,410,190.44c-.36-45.5-.2-91-.2-136.51V48.18H48.05ZM457.83,74.17v95.89h95.89C521.81,138.16,490,106.31,457.83,74.17Z"/></g></g></svg>
                        <svg width="63" height="63" v-show="computedIconType(item, 'audio')" viewBox="0 0 628 832.57" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,810.34V22.29C7,3.57,12.06.12,32.59.12Q234.72.12,436.84,0c11.64,0,20.73,3.8,28.87,12Q538.4,85.26,611.52,158.06c7.13,7.11,14.15,14,16.48,24.24v628a7.05,7.05,0,0,0-.85,1.69c-2.74,13.51-9.89,19.66-23.73,20.33-2.32.11-4.66.14-7,.14H145.52c-39,0-78-.13-117,.06C11.71,832.65,2,825.18.63,811.05.61,810.79.22,810.58,0,810.34Zm48.05-25.53H579.79v-567H573l-135.48.33c-9.23,0-18.21-1.65-23-10.22A37.76,37.76,0,0,1,410,190.44c-.36-45.5-.2-91-.2-136.51V48.18H48.05ZM457.83,74.17v95.89h95.89C521.81,138.16,490,106.31,457.83,74.17Z"/><path d="M409.83,550.18v-5.13q.09-89,.26-178c0-4-1-5.69-4.94-7q-73.93-24.27-147.75-48.94c-1.54-.52-3.11-.94-5.23-1.57v5.91q0,92.27,0,184.51c0,10,.31,20,.31,30,0,25.12-11.1,43.64-34,54.15-33.83,15.54-66.65,13.37-96.6-9.26-25.89-19.56-26-57.22-.74-77.58,23.24-18.72,50-22.8,78.76-16.56,1.3.28,2.59.58,3.9.82.28.05.59-.15,1.32-.37v-5.79q0-97.24,0-194.51a46.78,46.78,0,0,1,.58-7.94c2.52-14.67,14.46-22.54,29-18.86,6.6,1.68,13,4.07,19.5,6.22q91.91,30.6,183.79,61.24C452.33,326.3,457,333.17,457,348.31c0,84-.17,168,.12,252,.07,20.36-8.36,35.51-24.63,46.88-31.38,21.93-83.24,18.54-109.1-7.1-23.27-23.06-21-56.69,5.13-76.44,22.55-17,47.78-20.64,74.87-14.86ZM149.28,535.71a49.77,49.77,0,0,0,4.8,4.37c12,8.29,34.49,8.33,46.61.16,5.31-3.59,5.54-5.74,0-8.86-15.09-8.43-30.48-8.3-45.78-.45C152.91,531.94,151.41,533.85,149.28,535.71Zm233.24,78.83c8.53-.11,16.82-1.55,24-6.73,4-2.92,4-4.43,0-7.52-11.52-8.91-36.37-9-48.24-.16-4.26,3.18-4.36,4.67,0,7.85C365.47,613.16,373.79,614.46,382.52,614.54Z"/></g></g></svg>
                        <svg width="63" height="63" v-show="computedIconType(item, 'video')" viewBox="0 0 948 948" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M948,73V672c-2.26,11.34-9.52,19.29-17.42,27.17Q815.53,813.88,700.8,928.91c-8.14,8.16-16.08,16.3-27.8,19.09H73a12.67,12.67,0,0,0-2.65-.93c-34-4.12-60-27.32-67.91-60.59C1.54,882.68.81,878.83,0,875V73a16.45,16.45,0,0,0,.9-2.73c5-33.63,23.45-55.94,55.85-66.43C62,2.13,67.58,1.26,73,0H875a13.19,13.19,0,0,0,2.65.91c32.22,3.82,58.12,25.7,66.9,56.73C946,62.68,946.86,67.87,948,73ZM890.16,641.16v-5q0-277.74,0-555.49a27.63,27.63,0,0,0-.72-6.92c-2.85-10.87-10.63-15.86-24.54-15.86q-391,0-782,0c-17.32,0-25,7.71-25,25q0,391.25,0,782.49c0,17,7.81,24.82,24.74,24.82H641.16V717c0-14.5-.08-29,0-43.49.13-17.12,7.6-27.81,21.87-31A59.27,59.27,0,0,1,676,641.22q103.5-.12,207-.06Zm-190.89,58V845.73L845.53,699.15Z"/><path d="M322.16,456.69c0-52.32-.15-104.63.2-156.94,0-6.76,1.35-14.21,4.44-20.1,7.89-15,26.36-18.23,42-8.09,16.75,10.86,33.38,21.93,50.06,32.92q94,61.95,188.07,123.92a63.56,63.56,0,0,1,9.49,7.26c13.18,12.88,12.43,31.93-2.26,43.08-10.33,7.83-21.45,14.62-32.29,21.76Q475.53,570.55,369.17,640.58c-11.17,7.36-22.53,8.74-34.11,1.23-10-6.48-12.87-16.5-12.88-27.68Q322.14,535.41,322.16,456.69Zm222.68-.48L380.46,347.93V564.46Z"/></g></g></svg>
                    </div>
                    <div class="title">
                        <span v-html="item.basename"></span>
                    </div>
                    <div class="action" v-show="computedItemActionShow(item)">
                        <svg @click.stop="playItem(item)" width="18" height="18" class="play-btn" viewBox="0 0 139 139" xml:space="preserve"
                            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <path
                                d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                        </svg>
                        <svg @click.stop="playItemLater(item)" width="18" height="18" class="play-later-btn spacing" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z" />
                                    <path
                                        d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z" />
                                </g>
                            </g>
                        </svg>
                        <svg @click.stop="addItem(item)" width="16" height="16" class="add-btn spacing" viewBox="0 0 682.65 682.74"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="content list-view" v-if="viewMode == 0 && loading">
                <div v-for="i in 20" class="loading-mask item"></div>
            </div>
            <div class="content grid-view" v-if="viewMode == 1 && loading">
                <div v-for="i in 30" class="loading-mask item"></div>
            </div>
        </div>
    </div>
</template>

<style>
#webdav-session-detail-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    /*padding: 20px 33px 10px 33px;*/
    padding: 20px 0px 0px 0px;
    overflow: hidden;
}

#webdav-session-detail-view .spacing {
    margin-left: 20px;
}

#webdav-session-detail-view .to-right {
    position: absolute;
    right: 0px;
}


#webdav-session-detail-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
    padding: 0px 33px 0px 33px;
}

#webdav-session-detail-view .header .title-wrap {
    display: flex;
    position: relative;
    font-weight: bold;
}

#webdav-session-detail-view .header .title-wrap .title {
    text-align: left;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#webdav-session-detail-view .header .title-wrap .options {
    display: flex;
    align-items: center;
    margin-right: 6px;
    height: 100%;
}

#webdav-session-detail-view .about {
    text-align: left;
    margin-bottom: 0px;
    line-height: 29px;
    padding: 0px 33px 0px 35px;
    margin-bottom: 15px;
    color: var(--content-subtitle-text-color);
}

#webdav-session-detail-view .header .action {
    display: flex;
}


#webdav-session-detail-view .center {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#webdav-session-detail-view .center .list-title {
    margin-bottom: 6px;
    text-align: left;
    display: flex;
    position: relative;
    padding: 0px 33px 0px 33px;
}

#webdav-session-detail-view .center .list-title .size-text {
    font-weight: bold;
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
    cursor: pointer;
}

#webdav-session-detail-view .center .list-title .size-text.loading-mask {
    border-color: transparent;
}

#webdav-session-detail-view .center .list-title .size-text svg {
    fill: var(--content-highlight-color);
    transform: translateY(2px);
}

#webdav-session-detail-view .center .list-title .size-text span {
    margin-left: 5px;
}

#webdav-session-detail-view .center .list-title .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 38px;
}

#webdav-session-detail-view .center .location {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    color: var(--content-subtitle-text-color);
    font-size: calc(var(--content-text-size) - 1px);
    padding: 3px 36px 12px 36px;
    min-height: 20px;
}

#webdav-session-detail-view .center .location .current {
    word-wrap: break-word;
    line-break: anywhere;
    margin-left: 10px;
}

#webdav-session-detail-view .center .content {
    overflow: scroll;
    overflow-x: hidden;
    padding: 0px 33px 20px 33px;
}

#webdav-session-detail-view .center .content.list-view .item {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    margin-bottom: 8px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    /*box-shadow: 0px 0px 3px var(--border-popovers-border-color);*/
    --item-height: 63px;
}

#webdav-session-detail-view .center .item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#webdav-session-detail-view .center .content.list-view  .item > div {
    height: var(--item-height);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    /*font-size: var(--content-text-size);*/
}

#webdav-session-detail-view .center .content.list-view  .item .sqno {
    min-width: 36px;
    padding-left: 10px;
    flex: 1;
}

#webdav-session-detail-view .center .content.list-view  .item .icon {
    width: 50px;
    max-width: 50px;
    flex: 1;
    padding-left: 10px;
}

#webdav-session-detail-view .center .content .item .icon svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#webdav-session-detail-view .center .content.list-view  .item .title {
    flex: 10;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    margin-right: 15px;
    position: relative;
}

#webdav-session-detail-view .center .content .item .title span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#webdav-session-detail-view .center .content.list-view .item .title .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    left: 68%;

    display: flex;
    flex-direction: row;
    align-items: center;

    padding-left: 10px;
    padding-right: 10px;
    
    visibility: hidden;
}

#webdav-session-detail-view .center .content.list-view .item .title:hover span {
    width: 66%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    word-wrap: break-word;
    line-break: anywhere;
}

#webdav-session-detail-view .center .content .item .title:hover .action {
    visibility: visible;
}

#webdav-session-detail-view .center .content .item .action svg {
    fill: var(--button-icon-btn-color);
}

#webdav-session-detail-view .center .content .item .action svg:hover {
    fill: var(--content-highlight-color);
}

#webdav-session-detail-view .center .content.list-view  .item .size {
    min-width: 88px;
    margin-right: 15px;
    justify-content: flex-end
}

#webdav-session-detail-view .center .content.list-view  .item .type {
    min-width: 39px;
}

#webdav-session-detail-view .center .content.list-view  .item .updated {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    min-width: 115px;
    padding-right: 10px;
    /*font-size: var(--content-text-tip-text-size);*/
    font-size: calc(var(--content-text-size) - 1px);
}

#webdav-session-detail-view .center .content.list-view  .item .updated .hms {
    margin-bottom: 3px;
}

#webdav-session-detail-view .center .content.grid-view {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
}

#webdav-session-detail-view .center .content.grid-view .item {
    flex: none;
    width: 100px;
    padding: 15px 8px 15px 8px;
    margin-right: 3px;
    margin-left: 12px;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--border-list-item-vertical-border-radius);
    position: relative;
}

#webdav-session-detail-view .center .content.grid-view  .item .title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    text-align: center;
    word-wrap: break-word;
    line-break: anywhere;
    margin-top: 3px;
    /*font-size: calc(var(--content-text-size) - 1px);*/
}

#webdav-session-detail-view .center .content.grid-view .item .action {
    z-index: 3;
    padding: 12px 15px;
    position: absolute;
    width: calc(100% - 30px);
    bottom: 0px;
    left: 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    
    visibility: hidden;
    border-bottom-left-radius: var(--border-list-item-vertical-border-radius);
    border-bottom-right-radius: var(--border-list-item-vertical-border-radius);
}

#webdav-session-detail-view .center .content.grid-view .item:hover .action {
    visibility: visible;
    background: var(--content-list-item-hover-bg-color);
}

#webdav-session-detail-view .center .content.grid-view .item.loading-mask {
    height: 119px;
}
</style>