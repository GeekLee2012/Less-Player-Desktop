<script>
//定义名称，方便用于<keep-alive>
export default { name: 'EmbyView' }
</script>

<script setup>
import { inject, onMounted, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useCloudStorageStore } from '../store/cloudStorageStore';
import { Emby } from '../../vendor/emby';
import { emitEvents, onEvents } from '../../common/EventBusWrapper';
import EmptyControl from '../components/EmptyControl.vue';



const { visitEmbySessionCreate, visitEmbySessionEdit, visitEmbySessionDetail } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { isCloudStorageViewTipsShow } = storeToRefs(useSettingStore())
const { embySessions } = storeToRefs(useCloudStorageStore())
const { removeEmbySession, removeAllEmbySession } = useCloudStorageStore()



const embyRef = ref(null)
const back2TopBtnRef = ref(null)
const lastVisitedId = ref(null)
const setLastVisitedId = (value) => (lastVisitedId.value = value)


const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(embyRef.value)
}

const onScroll = () => {
    hideAllCtxMenus()
}

const onDrop = async (event) => {
    event.preventDefault()
    
}

const visitItem = (item) => {
    const { id } = item || {}
    if(!id) return 
    visitEmbySessionDetail(id)
    setLastVisitedId(id)
}

//TODO 暂不支持多个会话记录，仅对最近一个会话有效
const randomPlay = (item) => {
    emitEvents('emby-randomPlay')
}

const removeItem = async (item) => {
    const ok = await showConfirm('确定删除会话记录吗')
    if(!ok) return

    removeEmbySession(item)
}

const removeAll = async () => {
    if(embySessions.value.length < 1) return
    const ok = await showConfirm('确定清空全部会话记录吗')
    if(!ok) return

    showToast('会话记录已全部清空')
    removeAllEmbySession()
}

const tutorialList = [{
    title: '连接前准备：前往官方客户端“设置 - 用户 - Profile - 允许此用户管理服务器”'
}, {
    title: 'API Key：前往官方客户端“设置 - API密钥”'
}, {
    title: '随缘听：从曲库中随机选择一首歌曲进行播放'
}, {
    title: '歌曲Tab - 播放全部：仅播放当前分页的所有歌曲'
}, {
    title: '流派Tab：在Tab首页直接“播放流派”时，最多支持播放1024首'
},{
    title: '暂不支持：最近播放、收藏、关注等功能'
}, {
    title: '播放记录：无法同步至Emby'
}]

/* 生命周期、监听 */
onMounted(() => {
    resetBack2TopBtn()
})
</script>

<template>
    <div id="emby-view" ref="embyRef" @scroll="onScroll" >
        <div class="header">
            <div class="title">
                <span>Emby</span>
            </div>
            <div class="about" v-show="isCloudStorageViewTipsShow">
                <p>提示：实验性功能；当前使用Emby API版本为v{{ Emby.VERSION }}</p>
                <p>目前仅提供播放相关功能；若需进行数据管理，请使用Emby官方客户端</p>
            </div>
            <div class="action" :class="{ 'none-about': !isCloudStorageViewTipsShow }">
                <SvgTextButton text="新建会话" :leftAction="visitEmbySessionCreate">
                    <template #left-img>
                        <!--
                        <svg width="14" height="14"
                            viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                </g>
                            </g>
                        </svg>
                        -->
                        <svg width="18" height="18" viewBox="0 -50 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
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
                <SvgTextButton text="清空记录" :leftAction="removeAll" class="spacing">
                    <template #left-img>
                        <svg width="17" height="17" viewBox="0 0 256 256"
                            data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
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
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight">会话记录({{ embySessions.length }})</div>
            </div>
            <div v-for="(item, index) in embySessions" 
                v-show="embySessions.length > 0"
                class="session-item"
                @click="visitItem(item)">
                <div class="icon-wrap">
                    <svg width="28" height="28" viewBox="0 0 367.8 368.13" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M198.12,368.13a70.39,70.39,0,0,1-6-4.66q-15.42-15.11-30.7-30.35c-4.37-4.32-8.77-8.6-13.07-13-4-4.11-8-8.26-11.92-12.5-4.74-5.17-9.14-10.69-14.14-15.59a47.82,47.82,0,0,0-10.53-7.33c-.92-.51-3.47.74-4.53,1.87-10.09,10.83-11.93,10.64-21.34-1-4.06-5-9-9.3-13.55-13.89-9.11-9.17-18.2-18.37-27.4-27.46-4.72-4.67-9.71-9.05-14.46-13.69-6.7-6.55-13.29-13.22-19.92-19.84-3-3-6-6.1-9.12-9.06-2.34-2.24-1.49-4,.52-5.83,3.47-3.24,6.79-6.65,10.22-9.94,8.71-8.37,17.57-16.58,26.12-25.11,7-7,13.57-14.52,20.58-21.55,3.49-3.49,7.71-6.23,11.3-9.63,4.68-4.44,9.21-9.07,13.47-13.92,1-1.13,1.52-4.13.76-5.11A106.8,106.8,0,0,0,74.06,99.32c-2.43-2.36-2.69-4-.15-6.58q45.53-45.33,90.85-90.86c2.72-2.74,4.43-2.32,6.92.2,17.95,18.11,36.11,36,54,54.21,5.2,5.3,9.54,11.44,14.44,17.05,3.25,3.72,6.87,7.1,10.18,10.76,3.59,4,7.86,3.22,12.08-2a40.56,40.56,0,0,1,7.21-7.25,5.22,5.22,0,0,1,5,.39c10.29,10.15,20.29,20.59,30.48,30.84,6.22,6.25,12.71,12.22,19,18.43,13.71,13.63,27.25,27.42,41.09,40.93,3.34,3.26,3.73,5.25.18,8.75-26,25.68-51.74,51.56-77.57,77.37a24.84,24.84,0,0,1-2.19,2c-4.85,3.82-4.64,5.85.78,9.19a22.81,22.81,0,0,1,4.67,3.66c4,4.27,3.65,5.7-.5,9.9-4.64,4.7-8.79,9.88-13.45,14.55-3.37,3.38-7.49,6-10.82,9.43C259,307.79,252.2,315.62,245,323c-3.68,3.77-8.1,6.81-11.9,10.47-9.51,9.14-18.88,18.43-28.27,27.69C202.68,363.26,200.69,365.45,198.12,368.13Zm-61-117c.78,6.22,2.34,7.5,7.78,4.69,9.73-5,19.28-10.43,28.82-15.83,7.21-4.08,14.22-8.53,21.45-12.59,6.84-3.84,14-7.17,20.76-11.14,5.59-3.27,10.65-7.46,16.25-10.72,10-5.79,20.17-11.11,30.15-16.84,1.68-1,2.76-2.94,4.12-4.45-1.48-.85-2.95-1.71-4.43-2.55-.71-.41-1.47-.74-2.16-1.19-6.08-4-12-8.13-18.27-11.81-4.07-2.41-8.69-3.89-12.84-6.18-3-1.66-5.52-4.21-8.5-5.93-6.26-3.63-12.75-6.85-19-10.44-10.88-6.23-21.62-12.7-32.5-18.92-7.77-4.45-15.71-8.61-23.52-13-5.54-3.12-7.73-2-8.06,4.56-.08,1.66,0,3.33,0,5Z"/></g></g></svg>
                </div>
                <div class="title-wrap">
                    <span v-html="item.title"></span>
                </div>
                <div class="action" @click.stop="">
                    <div class="btn random-play-btn" 
                        @click="randomPlay(item)"
                        v-show="lastVisitedId == item.id">
                        <svg width="18" height="18" viewBox="0 0 768.11 768.93" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M384.2,509.12c-5.62,8.58-10.61,17-16.38,24.87-42.57,58-99.37,92.91-170.52,104A234.9,234.9,0,0,1,163,640.81c-43.5.32-87,.21-130.5.12C14.67,640.89.6,627.39.06,610.2-.53,591.75,13.72,577,32.51,577q63-.13,126,0c38.3,0,73.92-9.69,105.81-31,51.79-34.55,81.47-83,86.79-145.17A190.91,190.91,0,0,0,200.48,197.4c-14.06-3-28.73-4.05-43.14-4.24-41.65-.55-83.33-.1-125-.24-22.79-.08-38.09-22-30.3-43.11,4.44-12,15.83-20.7,28.59-20.74,46.67-.14,93.44-2,140,.48,92.18,4.86,162.42,48.2,210.63,127l2.76,4.54,3.21-5.28c42.17-69.24,103.1-111,183.24-123.77,15.53-2.49,31.5-2.64,47.29-3,21.65-.48,43.32-.12,66.19-.12-1.76-1.89-2.87-3.14-4-4.32-23.09-23.11-46.27-46.12-69.26-69.33C593.09,37.61,599.81,9,623.12,1.69,634.93-2,645.93.29,654.56,9c30.27,30.54,60.79,60.86,90.07,92.32,32.47,34.89,30.87,88.23-2.4,122.16Q699.53,267,656.63,310.4c-13.11,13.24-32.42,14.13-45.44,2.38-13.84-12.49-14.41-33.17-1-46.71C633,243.13,656,220.4,678.92,197.57c1.24-1.24,2.39-2.56,4.3-4.61h-4.29c-24.49,0-49-.21-73.49.08a192.07,192.07,0,0,0-182.25,139.8c-30.93,109.57,40,221.92,152.33,241.16a198.36,198.36,0,0,0,30.29,2.8c25.65.39,51.31.13,78.16.13-1.85-1.89-3-3.13-4.24-4.32q-34.37-33.51-68.71-67c-10.48-10.27-13.19-24.09-7.54-36.64a31.81,31.81,0,0,1,51.45-9.7c20.42,19.87,40.39,40.22,60.54,60.37,8.72,8.71,17.54,17.34,26.12,26.2,35.35,36.5,35.24,90.32-.31,126.63Q699,715.67,656.37,758.63c-18.25,18.36-48,11.12-54.62-13.24-3.35-12.28,0-23,9-32q34-33.84,68-67.76c1.26-1.25,2.45-2.57,4.48-4.71h-6.22c-24.33,0-48.7.78-73-.17-94.75-3.73-167.09-46.24-217-126.91Z"/></g></g></svg>
                    </div>
                    <div class="btn edit-btn spacing" @click="visitEmbySessionEdit(item.id)">
                        <svg width="18" height="18" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                                    <path
                                        d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div class="btn delete-btn spacing" @click="removeItem(item)">
                        <svg width="18" height="18" viewBox="0 0 256 256" data-name="Layer 1"
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
                    </div>
                </div>
            </div>
            <div v-for="(item, index) in tutorialList" 
                v-show="isCloudStorageViewTipsShow && embySessions.length < 1"
                class="session-item">
                <div class="icon-wrap">
                    <svg width="28" height="28" viewBox="0 0 367.8 368.13" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M198.12,368.13a70.39,70.39,0,0,1-6-4.66q-15.42-15.11-30.7-30.35c-4.37-4.32-8.77-8.6-13.07-13-4-4.11-8-8.26-11.92-12.5-4.74-5.17-9.14-10.69-14.14-15.59a47.82,47.82,0,0,0-10.53-7.33c-.92-.51-3.47.74-4.53,1.87-10.09,10.83-11.93,10.64-21.34-1-4.06-5-9-9.3-13.55-13.89-9.11-9.17-18.2-18.37-27.4-27.46-4.72-4.67-9.71-9.05-14.46-13.69-6.7-6.55-13.29-13.22-19.92-19.84-3-3-6-6.1-9.12-9.06-2.34-2.24-1.49-4,.52-5.83,3.47-3.24,6.79-6.65,10.22-9.94,8.71-8.37,17.57-16.58,26.12-25.11,7-7,13.57-14.52,20.58-21.55,3.49-3.49,7.71-6.23,11.3-9.63,4.68-4.44,9.21-9.07,13.47-13.92,1-1.13,1.52-4.13.76-5.11A106.8,106.8,0,0,0,74.06,99.32c-2.43-2.36-2.69-4-.15-6.58q45.53-45.33,90.85-90.86c2.72-2.74,4.43-2.32,6.92.2,17.95,18.11,36.11,36,54,54.21,5.2,5.3,9.54,11.44,14.44,17.05,3.25,3.72,6.87,7.1,10.18,10.76,3.59,4,7.86,3.22,12.08-2a40.56,40.56,0,0,1,7.21-7.25,5.22,5.22,0,0,1,5,.39c10.29,10.15,20.29,20.59,30.48,30.84,6.22,6.25,12.71,12.22,19,18.43,13.71,13.63,27.25,27.42,41.09,40.93,3.34,3.26,3.73,5.25.18,8.75-26,25.68-51.74,51.56-77.57,77.37a24.84,24.84,0,0,1-2.19,2c-4.85,3.82-4.64,5.85.78,9.19a22.81,22.81,0,0,1,4.67,3.66c4,4.27,3.65,5.7-.5,9.9-4.64,4.7-8.79,9.88-13.45,14.55-3.37,3.38-7.49,6-10.82,9.43C259,307.79,252.2,315.62,245,323c-3.68,3.77-8.1,6.81-11.9,10.47-9.51,9.14-18.88,18.43-28.27,27.69C202.68,363.26,200.69,365.45,198.12,368.13Zm-61-117c.78,6.22,2.34,7.5,7.78,4.69,9.73-5,19.28-10.43,28.82-15.83,7.21-4.08,14.22-8.53,21.45-12.59,6.84-3.84,14-7.17,20.76-11.14,5.59-3.27,10.65-7.46,16.25-10.72,10-5.79,20.17-11.11,30.15-16.84,1.68-1,2.76-2.94,4.12-4.45-1.48-.85-2.95-1.71-4.43-2.55-.71-.41-1.47-.74-2.16-1.19-6.08-4-12-8.13-18.27-11.81-4.07-2.41-8.69-3.89-12.84-6.18-3-1.66-5.52-4.21-8.5-5.93-6.26-3.63-12.75-6.85-19-10.44-10.88-6.23-21.62-12.7-32.5-18.92-7.77-4.45-15.71-8.61-23.52-13-5.54-3.12-7.73-2-8.06,4.56-.08,1.66,0,3.33,0,5Z"/></g></g></svg>
                </div>
                <div class="title-wrap">
                    <span v-html="item.title"></span>
                </div>
            </div>
            <EmptyControl
                v-show="!isCloudStorageViewTipsShow && embySessions.length < 1">
            </EmptyControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#emby-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#emby-view .spacing {
    margin-left: 20px;
}

#emby-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

#emby-view .header .title {
    text-align: left;
    margin-bottom: 5px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#emby-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 12px;
    line-height: 29px;
    color: var(--content-subtitle-text-color);
}

#emby-view .header .action {
    display: flex;
}

#emby-view .header .action.none-about {
    margin-top: 15px;
}

#emby-view .center .list-title {
    margin-bottom: 10px;
    text-align: left;
    font-weight: bold;
    display: flex;
    position: relative;
}

#emby-view .center .list-title .size-text {
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#emby-view .center .session-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    margin-top: 3px;
    margin-bottom: 15px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);
    --item-height: 68px;
}

#emby-view .center .session-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#emby-view .center .session-item > div {
    height: var(--item-height);
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

#emby-view .center .session-item .icon-wrap {
    width: 68px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#emby-view .center .session-item .icon-wrap svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#emby-view .center .session-item .title-wrap {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

#emby-view .center .session-item .title-wrap span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#emby-view .center .session-item .action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0px 20px 0px 33px;
    cursor: default;
    visibility: hidden;
}

#emby-view .center .session-item:hover .action {
    visibility: visible;
}

#emby-view .center .session-item .action .random-play-btn {
    transform: translateY(1px);
}
</style>