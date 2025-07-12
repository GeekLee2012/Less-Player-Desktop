<script>
//定义名称，方便用于<keep-alive>
export default { name: 'WebDavView' }
</script>

<script setup>
import { inject, onMounted, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useCloudStorageStore } from '../store/cloudStorageStore';



const { visitWebDavSessionCreate, visitWebDavSessionEdit, visitWebDavSessionDetail } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { isCloudStorageViewTipsShow } = storeToRefs(useSettingStore())
const { webdavSessions } = storeToRefs(useCloudStorageStore())
const { removeWebDavSession, removeAllWebDavSession } = useCloudStorageStore()



const webdavRef = ref(null)
const back2TopBtnRef = ref(null)


const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(webdavRef.value)
}

const onScroll = () => {
    hideAllCtxMenus()
}

const onDrop = async (event) => {
    event.preventDefault()
    
}

const removeItem = async (item) => {
    const ok = await showConfirm('确定删除会话记录吗')
    if(!ok) return

    removeWebDavSession(item)
}

const removeAll = async () => {
    if(webdavSessions.value.length < 1) return
    const ok = await showConfirm('确定清空全部会话记录吗')
    if(!ok) return

    showToast('会话记录已全部清空')
    removeAllWebDavSession()
}

const tutorialList = [{
    title: 'WebDAV支持音、视频播放；但仅提供只读模式，暂不支持上传、修改、删除等操作'
}, {
    title: '目录：单（双）击左键，即可进入'
}, {
    title: '音视频文件：双击左键，即可播放'
}, {
    title: '全部操作：不支持递归遍历子目录，涉及搜索、播放目录等操作'
}, {
    title: '播放目录：播放当前目录下的全部音频文件'
}, {
    title: '返回上级：返回到当前目录的上一级目录；当前为根目录(/)时，不再继续返回'
}, {
    title: '当前会话：点击带图标的Tab标题（即"当前目录"上方的标题），切换视图模式'
}, {
    title: '退出当前会话：点击“返回上级”右侧图标；或点击搜索框左边的后退(<)按钮'
}, {
    title: '拖拽下载：请确认设置页拖拽保存已开启；支持拖拽下载单个文件，不支持目录'
}, {
    title: '暂不支持：最近播放、关注、收藏等功能'
}]

/* 生命周期、监听 */
onMounted(() => {
    resetBack2TopBtn()
})
</script>

<template>
    <div id="webdav-view" ref="webdavRef" @scroll="onScroll" >
        <div class="header">
            <div class="title">WebDAV</div>
            <div class="about" v-show="isCloudStorageViewTipsShow">
                <p>提示：实验性功能；仅提供只读模式，不计划支持复杂功能</p>
                <p><b>郑重声明: 当前应用无法保证账号信息安全；当涉及隐私信息时，不建议使用此项WebDAV</b></p>
            </div>
            <div class="action" :class="{ 'none-about': !isCloudStorageViewTipsShow }">
                <SvgTextButton text="新建会话" :leftAction="visitWebDavSessionCreate">
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
                <div class="size-text content-text-highlight">会话记录({{ webdavSessions.length }})</div>
            </div>
            <div v-for="(item, index) in webdavSessions" 
                v-show="webdavSessions.length > 0"
                class="session-item"
                @click="visitWebDavSessionDetail(item.id)">
                <div class="icon-wrap">
                    <!--
                    <svg width="26" height="26" viewBox="0 0 80 80"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Capa_1" data-name="Capa 1">
                                <path
                                    d="M29.3,63.47l-4.05,4a9.05,9.05,0,0,1-12.72,0,8.8,8.8,0,0,1,0-12.51l14.9-14.79c3.08-3.06,8.89-7.57,13.13-3.37a5,5,0,1,0,7-7c-7.19-7.14-17.83-5.82-27.1,3.37L5.54,47.94a18.72,18.72,0,0,0,0,26.59,19,19,0,0,0,26.7,0l4-4a5,5,0,1,0-7-7ZM74.45,6C66.72-1.63,55.92-2,48.76,5.06l-5,5a5,5,0,0,0,7,7l5-5c3.71-3.69,8.57-2.16,11.73,1a8.79,8.79,0,0,1,0,12.52L51.58,41.37c-7.27,7.21-10.68,3.83-12.14,2.38a5,5,0,0,0-7,7,15.61,15.61,0,0,0,11.14,5c4.89,0,10-2.46,15-7.34l15.9-15.77A18.71,18.71,0,0,0,74.45,6Z" />
                            </g>
                        </g>
                    </svg>
                    -->
                    <svg width="26" height="26" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 816 817.24"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,571.06c1.22-8,2.26-16,3.7-23.95,8.14-45,29.46-83.24,61.19-115.64,37.54-38.33,75.89-75.87,113.5-114.14,20.54-20.9,52.45-10.11,59,12.09,4.11,13.95,1.74,26.34-8.71,36.8C201.92,393,175,419.59,148.47,446.53c-15.54,15.77-31.87,31-45.58,48.28-46.32,58.32-43.11,141.92,5.51,198.44,46.49,54,125.87,66.76,181.76,40.93a167.37,167.37,0,0,0,48.1-33.55q55.82-55.53,111.5-111.2c10-10,21.82-14,35.56-10.42,23.89,6.22,33.59,35.41,18.45,54.9a49.59,49.59,0,0,1-4.32,4.84q-50.35,50.4-100.74,100.76c-19,19-38.48,37.36-62.49,50.15-84.75,45.12-190.42,35.65-264.72-34C28.73,715.49,5.55,665.68.87,607.24A16.41,16.41,0,0,0,0,604.07Z"/><path d="M816,247c-1.17,7.85-2.14,15.73-3.55,23.54-8.11,45-29.32,83.32-61,115.74-37.53,38.35-75.65,76.12-113.6,114.05-13.88,13.86-33.4,15.6-47.59,4.57-16.86-13.11-18.2-37.72-2.76-53.17q52.14-52.15,104.4-104.18c20.4-20.34,37.17-43,46.35-70.74,28.57-86.4-22.65-179.25-111-200.84-57.81-14.13-107.74.42-149.88,41.9-37.53,36.94-74.6,74.34-111.92,111.5-10.24,10.19-22.65,13.45-36.3,9.28s-21.31-14.33-23.74-28.26c-2-11.53,1.69-21.56,9.79-29.66,39.72-39.7,79.22-79.64,119.54-118.72,38.19-37,84.6-56.33,137.54-60.23C577.54,1.42,582.76.61,588,0h8a16.58,16.58,0,0,0,3.25.8C634.09,2.39,667,11.25,697.36,28.3c62.94,35.37,101.57,88.56,114.79,159.79,1.59,8.58,2.58,17.28,3.85,25.93Z"/><path d="M578.5,268c.08,15.27-4.24,23.93-11.64,31.33Q507,359.29,447.15,419.29q-73.8,73.93-147.64,147.85c-12.65,12.66-27.6,15.91-41.82,9.26a34.92,34.92,0,0,1-11.29-55.11c1.67-1.86,3.42-3.65,5.18-5.42q132.66-132.8,265.33-265.58c15.22-15.24,35.06-16.55,50.1-3.23C574.62,253.8,578.44,262.44,578.5,268Z"/></g></g></svg>
                </div>
                <div class="title-wrap">
                    <span v-html="item.title"></span>
                </div>
                <div class="action" @click.stop="">
                    <div class="btn edit-btn" @click="visitWebDavSessionEdit(item.id)">
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
                v-show="isCloudStorageViewTipsShow && webdavSessions.length < 1"
                class="session-item">
                <div class="icon-wrap"> 
                    <img src="" v-show="false"/>
                    <svg width="26" height="26" viewBox="0 0 80 80"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Capa_1" data-name="Capa 1">
                                <path
                                    d="M29.3,63.47l-4.05,4a9.05,9.05,0,0,1-12.72,0,8.8,8.8,0,0,1,0-12.51l14.9-14.79c3.08-3.06,8.89-7.57,13.13-3.37a5,5,0,1,0,7-7c-7.19-7.14-17.83-5.82-27.1,3.37L5.54,47.94a18.72,18.72,0,0,0,0,26.59,19,19,0,0,0,26.7,0l4-4a5,5,0,1,0-7-7ZM74.45,6C66.72-1.63,55.92-2,48.76,5.06l-5,5a5,5,0,0,0,7,7l5-5c3.71-3.69,8.57-2.16,11.73,1a8.79,8.79,0,0,1,0,12.52L51.58,41.37c-7.27,7.21-10.68,3.83-12.14,2.38a5,5,0,0,0-7,7,15.61,15.61,0,0,0,11.14,5c4.89,0,10-2.46,15-7.34l15.9-15.77A18.71,18.71,0,0,0,74.45,6Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="title-wrap">
                    <span v-html="item.title"></span>
                </div>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#webdav-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#webdav-view .spacing {
    margin-left: 20px;
}

#webdav-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

#webdav-view .header .title {
    text-align: left;
    margin-bottom: 5px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#webdav-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 12px;
    line-height: 29px;
    color: var(--content-subtitle-text-color);
}

#webdav-view .header .action {
    display: flex;
}

#webdav-view .header .action.none-about {
    margin-top: 15px;
}

#webdav-view .center .list-title {
    margin-bottom: 10px;
    text-align: left;
    font-weight: bold;
    display: flex;
    position: relative;
}

#webdav-view .center .list-title .size-text {
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#webdav-view .center .session-item {
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

#webdav-view .center .session-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#webdav-view .center .session-item > div {
    height: var(--item-height);
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

#webdav-view .center .session-item .icon-wrap {
    width: 68px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#webdav-view .center .session-item .icon-wrap svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#webdav-view .center .session-item .title-wrap {
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

#webdav-view .center .session-item .title-wrap span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#webdav-view .center .session-item .action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0px 20px 0px 33px;
    cursor: default;
    visibility: hidden;
}

#webdav-view .center .session-item:hover .action {
    visibility: visible;
}
</style>