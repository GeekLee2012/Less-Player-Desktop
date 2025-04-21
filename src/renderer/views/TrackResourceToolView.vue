<script setup>
import { computed, inject, onActivated, onMounted, onUnmounted, ref, shallowRef, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import SearchBar from '../components/SearchBar.vue';
import { useSearchStore } from '../store/searchStore';
import { isBlank, randomTextWithinAlphabetNums, toTrimString } from '../../common/Utils';
import SongListControl from '../components/SongListControl.vue';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { Track } from '../../common/Track';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';




const { useWindowsStyleWinCtl } = inject('appCommon')
const { notifyLyricLoaded } = inject('player')

const { hideTrackResourceToolView, setWorkingTrackForResourceToolView,
    setTrackResourceToolViewPreviewMode: setPreviewMode, showToast,
 } = useAppCommonStore()
const { workingTrackForResourceToolView, trackResourceToolViewPreviewMode: isPreviewMode } = storeToRefs(useAppCommonStore())
const { platforms } = storeToRefs(useSearchStore())
const { getVendor } = usePlatformStore()
const { currentTrack } = storeToRefs(usePlayStore())
const { isNoneTrack, playTrack } = usePlayStore()


const copiedWorkingTrack = ref(null)
const currentTabView = shallowRef(null)
const searchBarRef = ref(null)
const contentRef = ref(null)
const tabData = ref([])
const activeTab = ref(0)
const activePlatform = ref(null)
const currentKeyword = ref(null)
const isLoading = ref(false)
let offset = 0, limit = 50, page = 1
const setCopiedWorkingTrack = (track) => {
    //JSON.stringify()无法处理 Map
    copiedWorkingTrack.value = JSON.parse(JSON.stringify(track))
    const { lyric, lyricTrans, lyricRoma } = track
    Object.assign(copiedWorkingTrack.value, { lyric, lyricTrans, lyricRoma } )
}
const setActiveTab = (value) => activeTab.value = value
const setActivePlatform = (value) => activePlatform.value = value
const setCurrentKeyword = (value) => currentKeyword.value = value
const setLoading = (value) => isLoading.value = value

const computedPlatforms = computed(() => {
    return platforms.value.filter(platform => {
        const { searchTabs } = platform
        return searchTabs.includes('all-songs')
    })
})

const visitTab = (item, index) => {
    setActivePlatform(item)
    setActiveTab(index)
    resetScrollState()
    loadSongs()
}

const updateTabData = (data) => {
    tabData.value.length = 0
    tabData.value.push(...data)
}

const loadSongs = async () => {
    currentTabView.value = SongListControl
    setLoading(true)
    const { code: platform } = activePlatform.value
    const vendor = getVendor(platform)
    if (!vendor || !vendor.searchSongs) return
    const keyword = currentKeyword.value
    if(isBlank(keyword)) return setLoading(false)
    let result = null, retry = 1
    do {
        result = await vendor.searchSongs(keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!result) return
    if (platform != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const resetScrollState = () => {
    if (contentRef.value) contentRef.value.scrollTop =  0
}

const resetTrackUrl = () => {
    const working = copiedWorkingTrack.value
    const current = workingTrackForResourceToolView.value || currentTrack.value
    if(!Track.isEquals(working, current)) return 

    const { url } = working
    Object.assign(current, { url })
    playTrack(current)
    showToast('音源已重置<br>即将为您播放')
}

const resetTrackCover = () => {
    const working = copiedWorkingTrack.value
    const current = workingTrackForResourceToolView.value || currentTrack.value
    if(!Track.isEquals(working, current)) return 

    const { cover  } = working
    Object.assign(current, { cover })
    showToast('封面已重置')
    emitEvents('track-coverUpdated', current)
}

const resetTrackLyric = () => {
    const working = copiedWorkingTrack.value
    const current = workingTrackForResourceToolView.value || currentTrack.value
    if(!Track.isEquals(working, current)) return 

    const { lyric, lyricTrans, lyricRoma } = working
    Object.assign(current, { lyric, lyricTrans, lyricRoma })
    notifyLyricLoaded(current)
    showToast('歌词已重置')
}

const resetTrackAll = () => {
    const working = copiedWorkingTrack.value
    const current = workingTrackForResourceToolView.value || currentTrack.value
    if(!Track.isEquals(working, current)) return 

    const { cover, lyric, lyricTrans, lyricRoma, url } = working
    Object.assign(current, {
        cover, lyric, lyricTrans, lyricRoma, url
    })
    playTrack(current)
    showToast('全部已重置<br>即将为您重新播放')
}

const togglePreview = () => {
    setPreviewMode(!isPreviewMode.value)
}

const getTrackKeyword = (track) => {
    if(isNoneTrack(track)) return null

    const title = Track.title(track)
    const artistName = Track.firstArtistName(track)
    return `${title} ${artistName}`
}

const visitActiveTab = () => {
    const index = activeTab.value
    const platform = computedPlatforms.value[index]
    visitTab(platform, index)
}

const refreshCurrent = () => {
    const track = workingTrackForResourceToolView.value || currentTrack.value
    setCopiedWorkingTrack(track)
    if(searchBarRef.value) {
        const keyword = getTrackKeyword(track)
        searchBarRef.value.setKeyword(keyword, true)
    }
}

watch(currentKeyword, visitActiveTab)
watch(workingTrackForResourceToolView, (nv, ov) => {
    if(nv) refreshCurrent()
}, { immediate: true })

onMounted(() => {
    refreshCurrent()
})

onUnmounted(() => {
    setWorkingTrackForResourceToolView(null)
    setCurrentKeyword(null)
    setPreviewMode(false)
})
</script>

<template>
    <div class="track-resource-tool-view" 
        :class="{ 'preview-mode': isPreviewMode }"
        v-gesture-dnm="{ trigger: '.header', excludes: ['.search-bar .keyword', '.search-bar svg', '.btn'] }">
        <div class="container">
            <div class="header">
                <div class="action" v-show="!useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideTrackResourceToolView">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="center">
                    <div class="title"></div>
                    <SearchBar ref="searchBarRef"
                        placeholder="搜索歌曲资源，更换封面、歌词、音源" 
                        :submitAction="setCurrentKeyword">
                    </SearchBar>
                </div>
                <div class="action right-action">
                    <div class="preview-btn btn text-btn" v-show="!isPreviewMode" @click="togglePreview">
                        <svg width="17" height="17" viewBox="0 -60 1024 712.45" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,367.07c-17.45,50.91-46.34,95.11-81.68,135C855.27,600.31,747.67,665.52,620.7,698.54A423.73,423.73,0,0,1,475,710.72c-51.1-4.63-100.21-17.71-147.7-36.88C242.65,639.66,167.76,590.65,104,525.16,61.71,481.79,27.47,433,4.63,376.55,3,372.44,1.54,368.23,0,364.07v-16C13.9,309.84,33.44,274.66,57.56,242c42.07-56.94,93.83-103.54,152.85-142.25C268,62,329.77,33.26,396.56,15.77,445.25,3,494.64-2.88,545,1.36,596.09,5.67,645.3,18.08,693,36.82c89.16,35.07,167.58,86.35,233.77,155.79,39,41,71,86.84,92.67,139.39,1.76,4.26,3.07,8.71,4.59,13.07ZM514.32,89A364.27,364.27,0,0,0,420,101.72C326.17,127,244.8,174.22,175.29,241.88,142.34,274,114.82,310.16,94.8,351.8a9.05,9.05,0,0,0,0,8.81,355.7,355.7,0,0,0,49.38,76.06c64.86,76.62,145.74,129.87,240,163.26,38.48,13.63,78.11,22.09,119.1,23.26,38.83,1.12,76.7-4.88,113.81-15.8,84.21-24.78,158.33-67.5,222.73-127,37.39-34.54,68.72-73.82,91.17-119.82a9.05,9.05,0,0,0,0-8.81c-17.67-36.67-41.29-69.17-69.35-98.46C803.37,192.54,734.37,148,655.91,118,609.69,100.3,562,89.52,514.32,89Z" />
                                    <path
                                        d="M511.83,200.33c85.66-.24,155.9,69.8,156.05,155.61S598.46,511.73,512.42,512.09s-156.23-69.71-156.3-155.81C356.05,270.5,425.86,200.58,511.83,200.33Zm0,222.71a66.82,66.82,0,1,0,0-133.63c-36.46,0-66.52,29.89-66.72,66.32A67,67,0,0,0,511.86,423Z" />
                                </g>
                            </g>
                        </svg>
                        <span>预览</span>
                    </div>
                    <div class="no-preview-btn btn text-btn" v-show="isPreviewMode" @click="togglePreview">
                        <svg width="18" height="18" viewBox="0 0 938.9 853.33" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M319.81,426.46a151.18,151.18,0,0,1,16.08-66c2-4,1.27-6-1.58-8.83Q195.64,213.14,57.09,74.52C43.52,61,39.11,45,46,27,57-1.64,93.59-9.17,115.75,12.55c21.54,21.11,42.72,42.6,64,63.92Q529.44,426.11,879.11,775.7c8.32,8.32,15.21,17.13,16.71,29.27,2.19,17.64-6,34.28-21.4,42.89a42.35,42.35,0,0,1-47.74-4.18,95.92,95.92,0,0,1-7.26-6.86Q682.07,699.49,544.8,562.06c-3.12-3.12-5.27-3.51-9.26-1.54-89.48,44.16-196.46-10.49-213-108.77C321.13,443.41,320.69,434.9,319.81,426.46Zm86.16-2.2c-2.58,42.1,37.43,70.21,65.57,65.6Z" />
                                    <path
                                        d="M97.46,427.43c19.14,19.57,37.41,39.23,56.74,57.78,42.71,41,89.21,77.08,141.33,105.51,39.71,21.67,81.38,37.91,126.24,45.28a295.75,295.75,0,0,0,120-4.94c16.23-4,30.85-1.48,43,10.35,23.76,23,13.28,63-19,71.55A373,373,0,0,1,456,725c-70-2.69-134.63-23.85-195.9-56.51C187.76,630,125,579,68.38,520.18c-19.5-20.26-37.73-41.78-55.84-63.32C-4.3,436.82-4,417,12.25,396.62a895.84,895.84,0,0,1,127.55-130c18.91-15.79,45.41-13.67,60.79,4.65,15.24,18.15,13.06,44.5-5.66,60.33a882.89,882.89,0,0,0-91.32,88.76C101.85,422.33,100.14,424.34,97.46,427.43Z" />
                                    <path
                                        d="M841.72,426.42c-15.13-15.86-29.36-31.52-44.37-46.38-49.87-49.37-104.42-92.55-167.23-124.57C591.74,235.9,551.54,221.77,508.7,216c-37.39-5-74.42-2.71-111.08,6.2-25.31,6.14-48.33-7-54-30.57-5.49-22.67,7.51-45.44,30.11-51.31A375.86,375.86,0,0,1,496,128.93c53.07,3.82,103.38,18.29,151.64,40.3,62.21,28.38,117.58,67.12,168.84,112A893,893,0,0,1,927.93,397.77c10.18,12.82,13.84,26.84,8.59,42.5a46,46,0,0,1-7.38,13.47A868.32,868.32,0,0,1,798,587.84c-18.12,15-44.55,12-59.55-6s-12.26-43.87,5.62-60.08q34.25-31.05,67.64-63C822,448.83,831.2,437.8,841.72,426.42Z" />
                                </g>
                            </g>
                        </svg>
                        <span>取消预览</span>
                    </div>
                    <div class="close-btn btn" v-show="useWindowsStyleWinCtl" @click="hideTrackResourceToolView">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="action">
                    <div class="refresh-btn text-btn btn" @click="refreshCurrent">
                        <svg width="15" height="15" viewBox="0 0 726.24 726.5" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M456.25,529.61C384.86,577,307.37,592.47,224,573.24,153.93,557.08,97.62,519,55.17,460.86-28.43,346.44-15.75,186.09,84.6,85.69c101.34-101.4,261-114.38,376.23-30.54,41.42,30.13,73,68.4,94.17,115.09,21.07,46.46,29.25,95.18,24.9,146-4.37,51-21.59,97.46-51.33,141.2,1.68,1.06,3.67,1.85,5,3.23Q622,549.41,710.24,638.25c14.25,14.32,19.28,31.43,13.88,50.84-10.61,38.09-57.48,50-86,22-23.29-22.9-46.23-46.15-69.33-69.24L459.56,532.66C458.52,531.62,457.4,530.67,456.25,529.61Zm56.64-238.83C513,168.29,413.34,68.68,290.67,68.67a221.82,221.82,0,0,0-222,222.1c0,122.25,99.47,221.82,221.82,222.16C412.61,513.26,512.77,413.22,512.89,290.78Z" />
                                </g>
                            </g>
                        </svg>
                        <span>当前播放</span>
                    </div>
                    <div class="clear-audio-btn btn text-btn" @click="resetTrackUrl">
                        <svg width="16" height="16" class="audio-file-btn spacing2" viewBox="0 0 866 976.19" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,829.18v-683C1,139,1.86,131.77,3,124.6,13.74,55.6,78.28.25,148.07.16Q230,.05,312,0,412.71,0,513.41.18c36.23.07,68.4,11.46,95.45,35.78,12.62,11.35,24.54,23.5,36.56,35.5q88.25,88.11,176.33,176.37C842.33,268.49,856,293.14,862,321.78c1.75,8.38,2.72,16.92,4,25.38v483a32.55,32.55,0,0,0-.86,4.22c-2.76,37.47-16.65,70.16-43.19,96.83-30.14,30.27-67.13,44.9-109.75,44.92q-278.93.12-557.86,0c-6,0-12-.3-17.94-.86-66.73-6.2-122.22-57.76-133.46-124C1.7,844,1,836.54,0,829.18ZM515.49,87.33H510c-24.83-.06-49.66-.17-74.49-.16q-140.47,0-280.95.15C115.67,87.34,88,114.9,88,153.65V824.08C88,860.6,116.36,889,153,889q66.24.11,132.48.16,188.47,0,376.94-.16c17.17,0,34.33.11,51.49,0A64,64,0,0,0,778,824.66q.11-86.24.15-172.47,0-145.23-.15-290.46V356h-6.5c-34,0-68,.1-102-.07a187,187,0,0,1-23.89-1.65c-73.38-9.95-129.1-72.52-130-146.4-.47-36-.09-72-.09-107.95Zm87.35,69.27c0,1.23,0,2.82,0,4.42,0,14.15.14,28.31.15,42.47,0,37,27.21,64.49,64.16,64.81,14.65.13,29.31,0,44,0,1.16,0,2.32-.28,4.7-.58C677.61,230.15,640.27,193.43,602.84,156.6Z"/><path d="M532.32,596.07v-84L369,533v6.08q0,72,0,144c0,36-22.1,64.39-57.35,71.46-43.06,8.63-80-14.31-88.76-55.23-5.76-26.93,5.59-48.1,26.8-64.23C266.07,622.6,284.64,617,306,620v-5.81q0-85,0-170c0-20.68,11.72-33.91,32.2-37.06,37.56-5.77,75.07-11.84,112.62-17.7,31-4.83,62-9.71,93-14.14,8.43-1.2,17.39-2.4,25.58-.84C585.55,377.52,596,392,596,408.49q0,125.75,0,251.47c0,33.07-23.58,62.64-55.93,70.18-42.82,10-84.25-17.66-90.72-61.09-3.16-21.25,6-38.16,21.08-52.41,13.67-13,29.89-20.21,48.73-21.21C523.43,595.21,527.74,595.82,532.32,596.07Z"/></g></g></svg>
                        <span>音源重置</span>
                    </div>
                    <div class="clear-cover-btn btn text-btn" @click="resetTrackCover">
                        <svg width="15" height="15" class="cover-btn spacing2" viewBox="0 0 853.56 853.59" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path d="M853.53,426.66q0,127,0,254c-.1,70.81-40.78,132.35-105.23,159.63a170.56,170.56,0,0,1-67.16,13.26q-254.46,0-508.93-.06C89,853.35,19.52,796.26,3.4,715.11A177.18,177.18,0,0,1,.17,680.86q-.3-254-.11-507.93C.1,100,42.58,37.94,110.39,11.29,130.31,3.47,151.1.05,172.44.05q254.22,0,508.44,0c83.47.07,153.14,57,169.26,138.38a191.21,191.21,0,0,1,3.25,36.24C853.66,258.68,853.53,342.67,853.53,426.66ZM768,428.5V280.77c0-36.16-.09-72.32,0-108.48,0-16.9-3.59-32.8-12.76-47-17.49-27.19-42.86-39.75-75-39.74q-253.46.08-506.92,0-3.5,0-7,.11a77.22,77.22,0,0,0-32.73,8c-32.29,16.31-48.11,43-48.14,78.89q-.15,191,0,381.94c0,1.59.15,3.17.27,5.56,1.89-1.67,3.25-2.8,4.53-4,33.73-32,67.35-64.1,101.23-95.94,40-37.6,97.31-40.84,141.42-8.22q36.17,26.73,72.21,53.62c12.45,9.26,21.74,8.62,32.71-2.35q65.91-65.93,131.83-131.87c39.6-39.57,101-39.59,140.75-.07q26.4,26.26,52.68,52.66C764.43,425.14,765.76,426.34,768,428.5ZM426.93,768q126.22,0,252.44-.07a104.31,104.31,0,0,0,21.35-1.79c40.61-8.62,67-41.61,67.26-83.93q.32-64.23-.1-128.47a12.12,12.12,0,0,0-3.4-7.62q-56.37-56.73-113-113.19c-7.9-7.9-14.78-7.87-22.74.08Q563,498.79,497.21,564.52c-39.27,39.16-97.72,43.18-142.08,10.06q-36.63-27.35-73.46-54.43c-10.88-8-21.84-7.3-31.63,2Q169.51,598.47,89,674.8A9.6,9.6,0,0,0,85.59,683c2.22,45,41.17,85.64,87.9,85.22C258,767.49,342.45,768,426.93,768Z"/>
                                    <path d="M233.64,298.78c-35.64-.12-64.83-29.55-64.61-65.14s29.65-64.83,65.21-64.6a64.87,64.87,0,0,1-.6,129.74Z"/>
                                </g>
                            </g>
                        </svg>
                        <span>封面重置</span>
                    </div>
                    <div class="clear-lyric-btn btn text-btn" @click="resetTrackLyric">
                        <svg width="16" height="16" class="lyric-btn spacing2" viewBox="0 0 852.18 916" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,458.22q0-173.48,0-347C0,58,35.78,13.53,87.64,2.54A103.7,103.7,0,0,1,108.93.26Q376.16,0,643.39,0c56.72,0,101,36.86,111.07,92.55A98.56,98.56,0,0,1,756,109.44c.14,30.83.32,61.67,0,92.49-.19,16.81-7.78,29.95-23,37.53s-30.18,6.22-43.87-3.75c-11.53-8.4-16.9-20.36-17-34.54-.11-28,0-56-.07-84a66.46,66.46,0,0,0-.86-10.92C668.68,92.12,659.2,84.17,644.74,84c-8.5-.08-17,0-25.5,0H134.78c-7.33,0-14.66-.24-22-.12C95.59,84.14,84,95.86,84,113q0,344.73,0,689.45C84,821.33,94.62,832,113.41,832H645.87c17.93,0,26.13-8.34,26.14-26.51q0-172.48,0-345c0-20.88,11.37-37.2,29.64-42.7A42,42,0,0,1,756,456.37c.08,1.67,0,3.33,0,5q0,173.24,0,346.47c0,54.54-36.18,97.66-89.81,106.79a110,110,0,0,1-18.41,1.31q-268.23.1-536.46,0C48.83,916,.07,867.29,0,804.7Q-.06,631.45,0,458.22Z"/><path d="M660.18,354.22v6q-.07,142.49-.16,285c0,83.72-61.63,157.26-144,171.94-95.94,17.09-186.75-44.76-204.51-140.5-17.9-96.51,44.19-186,138.12-204.77,43.55-8.69,84.34-1.95,122.7,20.24,1,.56,2,1.08,3.7,2,0-2.4,0-4.14,0-5.89q.08-73,.2-146c.06-19,4.37-36.65,17.1-51.45C609.78,271.68,643.11,255,678,270c48.68,21,95.26,45.43,135.83,80a304.15,304.15,0,0,1,27.31,26.3,40.92,40.92,0,0,1,6.31,46.95c-8,15.48-23.82,24.2-41.71,22.63a38.89,38.89,0,0,1-25.58-12.27c-26.91-28.76-59.36-49.7-94.2-67.31-6.68-3.38-13.45-6.57-20.2-9.8C664.19,355.79,662.51,355.19,660.18,354.22ZM576,644.54c0-50.84-41.42-92.38-92.12-92.38C434,552.17,392.23,594,392.18,644c0,50.39,41.55,92,92,92S576,694.65,576,644.54Z"/><path d="M345.51,276c-58.32,0-116.64.13-175-.09-17.46-.06-30.94-8.07-38.48-24-7.33-15.47-5.34-30.62,5.17-44.15,8.52-11,20.27-15.79,34.08-15.79H428.25c31.32,0,62.65-.31,94,.12,17,.23,30.26,8.21,37.66,23.7S565.41,246.43,555,260c-8.59,11.17-20.52,16-34.5,16Z"/><path d="M297.88,404q-63.49,0-127,0c-24.32-.05-42.94-18.42-42.86-42A41.78,41.78,0,0,1,170,320c27.83-.13,55.66,0,83.49,0q85.76,0,171.49,0c25.24,0,44,19.15,43.16,43.75-.74,22.2-19.51,40.16-42.27,40.21Q361.88,404.09,297.88,404Z"/><path d="M217.69,532c-16,0-32,.14-48,0a41.95,41.95,0,0,1-28.25-72.78,40.9,40.9,0,0,1,28.16-11.11c32.31-.19,64.62-.25,96.93,0A41.72,41.72,0,0,1,308,489.94c0,23.25-18.3,41.72-41.87,42C250,532.16,233.84,532,217.69,532Z"/></g></g></svg>
                        <span>歌词重置</span>
                    </div>
                    <div class="clear-btn btn text-btn" @click="resetTrackAll">
                        <svg width="16" height="16" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                        <span>全部重置</span>
                    </div>
                </div>
                <div class="tab-nav">
                    <div class="tab" 
                        :class="{ 
                            active: activeTab == index, 
                            'content-text-highlight': activeTab == index 
                        }"
                        v-for="(item, index) in computedPlatforms" 
                        @click="visitTab(item, index)" 
                        v-html="item.name">
                    </div>
                </div>
                <div class="content" ref="contentRef">
                    <component 
                        :id="randomTextWithinAlphabetNums(16)"
                        :is="currentTabView" 
                        :data="tabData" 
                        :artistVisitable="false" 
                        :albumVisitable="false"
                        :resourceMode="true"
                        :loading="isLoading" >
                    </component>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.track-resource-tool-view {
    display: flex;
    overflow: hidden;
    -webkit-app-region: none;
}

.track-resource-tool-view.preview-mode {
    height: 60px !important;
}

.track-resource-tool-view.preview-mode .container > .header {
    border-bottom: 1px solid transparent;
}

.track-resource-tool-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.track-resource-tool-view .container > .header,
.track-resource-tool-view .container > .center,
.track-resource-tool-view .container > .header .center  {
    display: flex;
    flex-direction: row;
}


.track-resource-tool-view .container > .header {
    padding: 12px 12px 12px 3px;
    border-bottom: 1px solid var(--border-color);
    background: transparent;
    align-items: center;
}

.track-resource-tool-view .container > .header .center {
    flex: 1;
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.track-resource-tool-view .container > .header .center .title {
    margin: 0px;
}

.track-resource-tool-view .container > .header .center .search-bar {
    flex: 1;
}

.track-resource-tool-view .container > .header .center .search-bar .keyword {
    width: 404px !important;
}

.track-resource-tool-view .container > .header .action {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 6px;
}

.track-resource-tool-view .container > .header .right-action {
    margin-right: 8px;
}

.track-resource-tool-view .container > .header .action .clear-btn-wrap {
    display: flex;
    align-items: center;
} 

.track-resource-tool-view .container > .header .action .text-btn,
.track-resource-tool-view .container > .center > .action .text-btn  {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--content-text-tip-text-size);
    margin-left: 20px;
}

.track-resource-tool-view .container > .header .action .close-btn {
    width: 30px;
}

.track-resource-tool-view .container > .header > .center {
    margin-left: 10px;
    display: flex;
    align-items: center;
}

.track-resource-tool-view .container > .center {
    flex: 1;
    background: transparent;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.track-resource-tool-view .container > .center > .action {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 10px 18px 8px 18px;
    border-bottom: 1px solid var(--border-color);
}

.track-resource-tool-view .container > .center > .action .text-btn  {
    margin-right: 25px;
    margin-left: 0px;
}


.track-resource-tool-view .container > .center .tab-nav {
    --margin-left: 12px;
    --margin-right: 12px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
    margin-left: var(--margin-left);
    margin-bottom: 3px;
    width: calc(688px - var(--margin-left) - var(--margin-right));
    overflow: hidden;
    overflow-x: scroll !important;
    overflow-y: hidden !important;
}

.track-resource-tool-view .container > .center .tab-nav .tab {
    font-size: calc(var(--content-text-tab-title-size) - 2px);
    margin-right: 18px;
    padding: 8px 6px 4px 6px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    min-width: max-content;
    overflow: hidden;
}

.track-resource-tool-view .container > .center .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

.track-resource-tool-view .container > .center .tab-nav .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}

.track-resource-tool-view .container > .center .tab-nav::-webkit-scrollbar {
    display: none !important;
}

.track-resource-tool-view .container > .center > .content {
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
    padding: 0px 12px 3px 12px;
}
</style>