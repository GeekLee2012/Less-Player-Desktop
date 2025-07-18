<script>
//定义名称，方便用于<keep-alive>
export default { name: 'FreeVideoEditView' }
</script>

<script setup>
import { ref, reactive, inject, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import { useVideoPlayStore } from '../store/videoPlayStore';
import { coverDefault, transformUrl, isSupportedVideo, 
    toTrimString, toLowerCaseTrimString, ipcRendererInvoke, 
    parseVideoCollectionLines, useGitRepository,
    recheckVideoCollectionData, isLocalFile, isHttpUrl } from '../../common/Utils';
import { Video } from '../../common/Video';
import { Playlist } from '../../common/Playlist';



const { playVideo, playPlaylist } = inject('player')
const { backward } = inject('appRoute')
const { showConfirm, visitLink } = inject('apiExpose')


const props = defineProps({
    id: String
})

const { showToast, showFailToast } = useAppCommonStore()
const { recentVideos, isPlayFromBeginning } = storeToRefs(useVideoPlayStore())
const { getRecentLatestVideos, clearRecentVideos, 
    toggleSavePlayingPos, removeRecentVideo, } = useVideoPlayStore()
const { platforms } = storeToRefs(usePlatformStore())

const coverRef = ref(null)
const detail = reactive({ title: '', url: '', streamType: 0, tags: '', about: '', cover: '' })
const setStreamType = (value) => Object.assign(detail, { streamType: value })
const titleInvalid = ref(false)
const urlInvalid = ref(false)
const isActionDisabled = ref(false)
const isCoverShow = ref(false)
const { GITHUB, GITEE } = useGitRepository()
//const levcUrl = `${GITEE}/blob/master/LeVC.md`
const levcUrl = `${GITHUB}/blob/main/LeVC.md`

const resetCheckStatus = () => {
    titleInvalid.value = false
    urlInvalid.value = false
}

const setupVideoUrl = (url) => Object.assign(detail, { url })

const parsePlay = async (lines) => {
    if(!lines || !Array.isArray(lines) || lines.length < 1) return
    const failText = '视频URL无法解析'

    const video = parseVideoCollectionLines(lines)
    if(!video) return showFailToast(failText)
    
    const { vcType, url: vcUrl, data: vcData, type } = video
    if(typeof type == 'undefined') Object.assign(video, { type: Playlist.VIDEO_TYPE })

    let _video = video, maySupported = true
    if(!Video.isCollectionType(video)) {
        if(!vcUrl) return showFailToast(failText)
        if(!isLocalFile(vcUrl)) {
            const _platforms = platforms.value('video-extract')
            for(let i = 0; i < _platforms.length; i++) {
                const { code, vendor } = _platforms[i]
                if(!vendor.canExtractVideo || !vendor.extractVideo) continue
                maySupported = await vendor.canExtractVideo(vcUrl)
                if(!maySupported) continue

                _video = await vendor.extractVideo(vcUrl)
                if(!_video) continue
                const { id, vid } = _video
                if(id && vid) break
            }
            //再次确认
            if(!maySupported) maySupported = isHttpUrl(vcUrl)
        } 
    } else {
        _video = recheckVideoCollectionData(_video)
        //再次确认
        maySupported = (_video.url || (_video.data && _video.data.length > 0))
    }
    if(!maySupported) return showFailToast(failText)
    playPlaylist(_video)
}

const submit = () => {
    resetCheckStatus()
    const { title, url, streamType, tags, about, cover } = detail
    //检查合法性
    if (!url || toTrimString(url).length < 10) {
        urlInvalid.value = true
        return
    }
    const lines = toTrimString(url).split('\n')
    parsePlay(lines)
}

const playRecentLatest = (video) => {
    if(!video) return 
    const { data, index, pos } = video
    const isResetPos = isPlayFromBeginning.value
    const _pos = isResetPos ? -1 : pos
    showToast('即将为您恢复最近播放', () => playVideo(data, index, _pos ))
}

const togglePlayOption = () => {
    toggleSavePlayingPos()
}

const computedRecentVideos = computed(() => (getRecentLatestVideos()))

const computedRecentVideoTitle = computed(() => {
    return (recentVideo) => {
        const { data: video, index } = recentVideo
        const { title, data } = video
        const _title = title ? `${title} - ` : ''
        const isCollectionType = Video.isCollectionType(video)
        const subtitle = isCollectionType ? data[index].title : ''
        return isCollectionType && (data && data.length > 1) ? `${_title}${subtitle}` : title
    }
})

const urlPlaceholder = computed(() => {
    return `视频URL，支持file / http / https协议；支持LeVC格式`
})


const clearRecents = async () => {
    const ok = await showConfirm('确定要清空最近播放吗？')
    if(!ok) return
    clearRecentVideos()
    showToast('最近播放已清空')
}

const clearText = async () => {
    const ok = await showConfirm('确定要清空当前输入吗？')
    if(!ok) return
    Object.assign(detail, { url: '' })
    resetCheckStatus()
}

const dragToDelete = async (item) => {
    if(!item) return 

    const ok = await showConfirm('确定要删除当前播放记录吗？')
    if(!ok) return

    const { data: video, index, pos } = item
    removeRecentVideo(video)
}

const demoShow = ref(true)
let demoTimer = null
const dragToDeleteDemo = async () => {
    const ok = await showConfirm('演示：确定要删除当前播放记录吗？')
    if(!ok) return

    demoShow.value = false

    clearTimeout(demoTimer)
    demoTimer = setTimeout(() => {
        demoShow.value = true
    }, 3000)
} 

const onDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer
    if (files.length > 1) return

    if (isSupportedVideo(files[0])) {
        const { path } = files[0]
        setupVideoUrl(path)
        event.stopPropagation()
    }
}

//TODO
const updateCover = async () => {
    const result = await ipcRendererInvoke('open-image')
    if (result && result.length > 0) {
        const cover = result[0]
        Object.assign(detail, { cover })
    }
}
</script>

<template>
    <div id="free-video-edit-view" @dragover="(e) => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <div class="title-wrap">
                <span class="title" v-show="!id">视频播放</span>
            </div>
            <div class="action-wrap">
                <div class="action">
                    <SvgTextButton :leftAction="submit" :rightAction="clearRecents" text="开始播放" :disabled="isActionDisabled">
                        <template #left-img>
                            <svg width="17" height="17" class="play-btn" viewBox="0 0 139 139" xml:space="preserve"
                                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                        </template>
                        <template #right-img>
                            <svg width="17" height="17" viewBox="0 0 256 256" data-name="Layer 1"
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
                        </template>
                    </SvgTextButton>
                </div>
                <div class="right-action">
                    <div class="edit-btn text-btn" @click="clearText">
                        <svg width="17" height="17" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                                    <path
                                        d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                                </g>
                            </g>
                        </svg>
                        <span>清空</span>
                    </div>
                    <div class="checkbox text-btn spacing" @click="togglePlayOption">
                        <svg v-show="!isPlayFromBeginning" width="16" height="16" viewBox="0 0 731.64 731.66"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                </g>
                            </g>
                        </svg>
                        <svg v-show="isPlayFromBeginning" class="checked-svg" width="16" height="16"
                            viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                </g>
                            </g>
                        </svg>
                        <span>从头开始播放</span>
                    </div>
                    <div class="about-levc-btn btn spacing" @click.prevent="visitLink(levcUrl)">
                        <svg width="18" height="18" viewBox="0 0 971.81 971.81" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M486.07,0c268,.22,486.31,218.73,485.74,486.19-.58,268.32-218.65,486.07-486.33,485.62C217.41,971.36-.41,753.1,0,485.35S218.54-.22,486.07,0ZM906,480.4C903.12,249.81,713.68,62.49,479.65,65.83,249.27,69.11,61.33,258.93,65.87,494.4,70.28,723.62,259.11,909.23,492.16,906,722.37,902.74,908.91,713.58,906,480.4Z" />
                                    <path
                                        d="M541.8,575.89c0,41.66.09,83.32,0,125-.07,26.85-17,48.76-42.16,55.12a55.73,55.73,0,0,1-69.56-53.86c-.18-58.66-.05-117.32-.05-176,0-25.33-.16-50.66,0-76,.26-32.6,26.76-57.77,58.73-56.07a55.76,55.76,0,0,1,53,55.81C541.91,491.9,541.8,533.9,541.8,575.89Z" />
                                    <path
                                        d="M549.8,281.74c.08,35.75-27.83,63.92-63.49,64.06-36,.14-64.23-27.85-64.31-63.74-.08-35.72,27.87-63.92,63.49-64.06C521.5,217.87,549.71,245.83,549.8,281.74Z" />
                                </g>
                            </g>
                        </svg>
                        <a href="#" class="link">LeVC格式</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="center">
            <div v-show="isCoverShow">
                <img class="cover" v-lazy="coverDefault(detail.cover)" ref="coverRef" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
            </div>
            <div class="right" :class="{ 'no-cover': !isCoverShow }">
                <div class="form-row">
                    <div v-show="false">
                        <span>URL</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <textarea class="url-text" v-model="detail.url" :class="{ invalid: urlInvalid }" 
                            :placeholder="urlPlaceholder">
                        </textarea>
                    </div>
                </div>
                <div class="form-row history-row" >
                    <div class="title">
                        <svg width="17" height="17" class="history-btn" viewBox="0 0 767.87 750.82" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M140.66,202c17,14.91,33.66,29.54,50.38,44.06,5.55,4.82,9.76,10.45,11.8,17.56C209.3,286.17,192.77,306.88,168,307q-66,.17-132,0a56,56,0,0,1-6.47-.49C13.13,304.51.3,291,.2,274.47c-.24-40.67-.31-81.33,0-122,.11-13.31,7.33-23.06,19.3-28.65,12.59-5.88,24.78-4.2,35.62,4.44,9.25,7.37,18.08,15.26,27.1,22.92,2.26,1.92,4.54,3.81,7.15,6,1.38-1.8,2.49-3.21,3.55-4.64C149.48,76.28,224.12,27.65,316.89,8c196.27-41.54,392.59,82.56,440,277.46a375.14,375.14,0,0,1,9.95,118c-12.17,158.3-121.5,290.34-271.65,332.89-45.22,12.82-91.3,17.43-138,12.63C209.7,733.79,90.48,640.5,39,501.48c-8-21.55,3.81-43,23.59-47.36,16.81-3.74,33.51,5.57,39.53,22.58,16.56,46.84,42.52,87.65,78.73,121.72,47.47,44.66,103.51,72,168.09,81.26C508.72,702.5,658.43,598.36,693,440.61c35.9-164-68.83-328.57-232.36-365.12C341,48.77,220.44,93.7,147.66,192.12,145.38,195.19,143.24,198.36,140.66,202Z" />
                                    <path
                                        d="M324.24,323.68c0-28.5-.11-57,.05-85.49.09-16.1,12.4-30.31,27.77-32.61,17.53-2.63,33.33,6.83,38.22,23.23a44.12,44.12,0,0,1,1.6,12.29q.17,71,0,142c0,4,1.18,6.12,4.88,7.95,37.12,18.42,74.11,37.09,111.19,55.61,9.25,4.62,16.14,11.35,18.88,21.42,3.78,13.92.58,26.28-10.62,35.63s-23.9,10.55-36.91,4.19c-22.13-10.8-44.07-22-66.09-33q-34.37-17.21-68.73-34.4c-13.6-6.77-20.27-17.67-20.25-32.81q.06-42,0-84Z" />
                                </g>
                            </g>
                        </svg>
                        <span>最近播放：</span>
                    </div>
                    <div class="link-item" v-for="(item, index) in computedRecentVideos" 
                            @click="playRecentLatest(item)" 
                            :draggable="true"
                            @dragend="dragToDelete(item)"
                            v-html="computedRecentVideoTitle(item)">
                    </div>
                    <div class="link-item" v-show="recentVideos.length < 1 && demoShow"
                        :draggable="true"
                        @dragend="dragToDeleteDemo()">
                        播放记录，保留最近66条；单击即可播放；轻轻拖拽即可删除
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#free-video-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#free-video-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 15px;
}

#free-video-edit-view .header .title {
    text-align: left;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#free-video-edit-view .header .action-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 10px;
    position: relative;
    width: 100%;
}

#free-video-edit-view .header .action-wrap .action {
    display: flex;
    flex-direction: row;
}

#free-video-edit-view .header .action-wrap .right-action {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 10px;
}

#free-video-edit-view .header .action-wrap .right-action .edit-btn svg {
    transform: translateY(2px);
}

#free-video-edit-view .header .action-wrap .right-action .checkbox svg {
    transform: translateY(-1px);
}

#free-video-edit-view .header .action-wrap .right-action .about-levc-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
}

#free-video-edit-view .header .action-wrap .right-action .about-levc-btn .link {
    margin-left: 5px;
}


#free-video-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#free-video-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
    object-fit: contain;
}

#free-video-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: var(--border-inputs-border-radius);
    cursor: pointer;
}


#free-video-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#free-video-edit-view .center .no-cover {
    margin-left: 0px;
}

#free-video-edit-view .center .form-row {
    margin-bottom: 15px;
}

#free-video-edit-view .center .form-row > div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#free-video-edit-view .center .form-row > span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#free-video-edit-view .center .form-row input,
#free-video-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    outline: none;
    padding: 5px 8px;
    border-radius: var(--border-inputs-border-radius);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    /*font-size: 15px; */
    font-size: var(--content-text-size);
}

#free-video-edit-view .center .form-row input {
    height: 25px;
}

#free-video-edit-view .center .form-row textarea {
    height: 314px;
    padding: 8px;
}

#free-video-edit-view .center .form-row .stream-type-item {
    /*min-width: 136px;*/
    padding: 6px 15px;
    text-align: center;
    border-radius: 10rem;
    /*margin-right: 20px;*/
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#free-video-edit-view .center .form-row .stream-type-item:hover {
    background-color: var(--border-color);
    background-color: var(--content-list-item-hover-bg-color);
}

#free-video-edit-view .center .form-row .active {
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

#free-video-edit-view .history-row {
    text-align: left;
    display: flex;
    align-items: flex-start;
    margin-bottom: 0px !important;
    flex-wrap: wrap;
    --item-height: 39px;
}

#free-video-edit-view .history-row .title {
    display: flex;
    align-items: center !important;
    justify-content: flex-start;
    height: var(--item-height);
}

#free-video-edit-view .history-row .history-btn {
    margin-left: 5px;
    margin-right: 5px;
    /*transform: translateY(-4.5px);*/
}

#free-video-edit-view .form-row.history-row span {
    font-size: calc(var(--content-text-size) + 1px);
}

/*
#free-video-edit-view .history-row .history-btn,
#free-video-edit-view .form-row.history-row span.sec-title {
    display: -webkit-box;
    min-width: fit-content;
}
*/

#free-video-edit-view .history-row .history-btn {
    fill: var(--button-icon-btn-color);
}

/*
#free-video-edit-view .form-row.history-row .link-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    flex: 1;
}
*/

#free-video-edit-view .form-row.history-row .link-item {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    vertical-align: middle;
    word-wrap: break-word;
    line-break: anywhere;
    
    /*border-radius: var(--border-inputs-border-radius);*/
    border-radius: var(--border-list-item-vertical-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);

    margin-left: 3px;
    margin-right: 10px;
    margin-bottom: 13px;
    padding: 0px 10px;
    height: var(--item-height);
    line-height: var(--item-height);
}

#free-video-edit-view .form-row.history-row .link-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#free-video-edit-view .spacing {
    margin-left: 20px;
}

#free-video-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#free-video-edit-view .hl-link-item {
    cursor: pointer;
    color: var(--content-highlight-color) !important;
    text-decoration: none;
}

#free-video-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

.contrast-mode #free-video-edit-view .center .cover-eidt-btn {
    font-weight: bold;
}

/*
#free-video-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>