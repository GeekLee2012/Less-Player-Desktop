<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'NavidromeView'
}
</script>

<script setup>
import { inject, onMounted, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useCloudStorageStore } from '../store/cloudStorageStore';
import { Navidrome } from '../../vendor/navidrome';



const { visitNavidromeSessionCreate, visitNavidromeSessionEdit, visitNavidromeSessionDetail } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { } = storeToRefs(useSettingStore())
const { navidromeSessions } = storeToRefs(useCloudStorageStore())
const { removeNavidromeSession, removeAllNavidromeSession } = useCloudStorageStore()



const navidromeRef = ref(null)
const back2TopBtnRef = ref(null)


const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(navidromeRef.value)
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

    removeNavidromeSession(item)
}

const removeAll = async () => {
    if(navidromeSessions.value.length < 1) return
    const ok = await showConfirm('确定清空全部会话记录吗')
    if(!ok) return

    showToast('会话记录已全部清空')
    removeAllNavidromeSession()
}

/* 生命周期、监听 */
onMounted(() => {
    resetBack2TopBtn()
})
</script>

<template>
    <div id="navidrome-view" ref="navidromeRef" @scroll="onScroll" >
        <div class="header">
            <div class="title">
                <span>Navidrome</span>
            </div>
            <div class="about">
                <p>提示：实验性功能；当前使用Subsonic API版本为v{{ Navidrome.VERSION }}</p>
                <p>目前仅提供播放相关功能；若需进行数据管理，请使用Navidrome官方客户端</p>
            </div>
            <div class="action" :class="{ 'none-about': false }">
                <SvgTextButton text="新建会话" :leftAction="visitNavidromeSessionCreate">
                    <template #left-img>
                        <svg width="13" height="13"
                            viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton text="清空记录" :leftAction="removeAll" class="spacing">
                    <template #left-img>
                        <svg width="15" height="15" viewBox="0 0 256 256"
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
                <div class="size-text content-text-highlight">会话记录({{ navidromeSessions.length }})</div>
            </div>
            <div v-for="(item, index) in navidromeSessions" 
                v-show="navidromeSessions.length > 0"
                class="session-item"
                @click="visitNavidromeSessionDetail(item.id)">
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
                <div class="action" @click.stop="">
                    <div class="btn edit-btn" @click="visitNavidromeSessionEdit(item.id)">
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
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#navidrome-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#navidrome-view .spacing {
    margin-left: 20px;
}

#navidrome-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

#navidrome-view .header .title {
    text-align: left;
    margin-bottom: 5px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#navidrome-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 12px;
    line-height: 29px;
    color: var(--content-subtitle-text-color);
}

#navidrome-view .header .action {
    display: flex;
}

#navidrome-view .header .action.none-about {
    margin-top: 6px;
}

#navidrome-view .center .list-title {
    margin-bottom: 10px;
    text-align: left;
    font-weight: bold;
    display: flex;
    position: relative;
}

#navidrome-view .center .list-title .size-text {
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#navidrome-view .center .session-item {
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

#navidrome-view .center .session-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#navidrome-view .center .session-item > div {
    height: var(--item-height);
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

#navidrome-view .center .session-item .icon-wrap {
    width: 68px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#navidrome-view .center .session-item .icon-wrap svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#navidrome-view .center .session-item .title-wrap {
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

#navidrome-view .center .session-item .title-wrap span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#navidrome-view .center .session-item .action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0px 20px 0px 33px;
    cursor: default;
}
</style>