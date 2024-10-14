<script setup>
import { ref, watch, inject, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import { ActivateState } from '../../common/Constants';
import { transformUrl, coverDefault, escapeHtml } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';
import ToggleControl from '../components/ToggleControl.vue';



const props = defineProps({
    index: Number,
    data: Object, //Track
    deleteFn: Function,
    dataType: Number,
    toggleAction: Function,
})

const { showContextMenu,  } = inject('appCommon')
const { showConfirm, visitLink } = inject('apiExpose')

const { isShowDialogBeforeVisitPluginRepository } = storeToRefs(useSettingStore())

const visitRepository = async (url) => {
    const _url = transformUrl(url)
    const msg = `即将打开浏览器，前往插件官网：${_url}。\n确定要继续吗？`
    if (isShowDialogBeforeVisitPluginRepository.value) {
        const ok = await showConfirm(msg)
        if(!ok) return 
    }
    visitLink(_url)
}

const onContextMenu = (event) => {
   
}

const hasIcon = computed(() => {
    return data => (data.icon)
})

/* 生命周期、监听 */
</script>

<template>
    <div class="plugin-item" @click="" @contextmenu="onContextMenu">
        <div class="icon-wrap"> 
            <img :src="coverDefault(data.icon)" v-show="hasIcon(data)"/>
            <svg width="32" height="32" v-show="!hasIcon(data)" viewBox="0 0 703.66 832.24" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M.05,480.55q0-137.49,0-275c0-37.8,24-67.63,60.93-75.29a82.19,82.19,0,0,1,16.36-1.49q56.25-.18,112.49.08c4.68,0,6.19-1.62,7.15-5.82C211.38,60,263.25,11.93,327.63,1.87c81.68-12.76,161.09,41.05,178.86,121.31.95,4.32,2.64,5.76,7.23,5.73q57-.3,114,0c20.65.13,38.75,7.18,53.55,21.94s21.89,32.56,22,53c.32,48.82.17,97.65.09,146.48,0,19.8-13.86,33.51-33.69,33.77-46.9.6-86.78,36.28-93.35,82.69A96.56,96.56,0,0,0,654.93,575.4c7,1.29,14.27,1,21.31,2.11,16.07,2.59,27.08,15.18,27.14,31.55.19,50,.55,100-.07,150-.52,41.31-34.31,73.09-76.37,73.1q-229.25.06-458.47.05c-31.17,0-62.33.13-93.5,0C40.59,832,11.25,809.38,2.7,776.25A84.07,84.07,0,0,1,.12,755.53Q-.13,618,0,480.55ZM351.27,768.66v.06H626.76c9.5,0,13.3-3.81,13.3-13.34,0-37.33-.13-74.66.17-112,0-5.51-1.72-7.17-6.81-8.35-80.16-18.57-133.49-98.22-120.2-179.2,10.6-64.63,57.71-115.32,121.18-130.07,4.75-1.11,5.86-3.08,5.83-7.68-.18-37.16-.09-74.33-.09-111.5,0-11.32-3.22-14.52-14.56-14.52q-71.74,0-143.49,0c-17.82,0-30.5-10.54-33.36-28-1.13-6.87-.72-14-2-20.82C436.7,89,384.48,54.5,330.49,66.25c-42.26,9.19-74.6,48.36-75,90.87-.22,21.8-13.56,35-35.47,35l-142,0c-11.24,0-14.51,3.3-14.51,14.62q0,273.75,0,547.5c0,11,3.36,14.4,14.24,14.4Z"/></g></g></svg>
        </div>
        <div class="center">
            <div class="title-action-wrap">
                <div class="title-wrap">
                    <span v-html="data.alias || data.name"></span>
                </div>
                <div class="action" @click.stop="">
                    <ToggleControl @click="toggleAction" :value="data.state == 1"></ToggleControl>
                    <div class="btn delete-btn spacing1" @click="deleteFn">
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
            <div class="about">
                <span v-html="escapeHtml(data.about || '暂无简介')"></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.plugin-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-top: 3px;
    margin-bottom: 15px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);
    --item-height: 79px;
}

.plugin-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

.plugin-item .hidden {
    display: none !important;
}

.plugin-item > div {
    height: var(--item-height);
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

.plugin-item .spacing {
    margin-left: 18px !important;
}

.plugin-item .spacing1 {
    margin-left: 23px !important;
}

.plugin-item .icon-wrap {
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.plugin-item .icon-wrap img {
    width: 45px;
    height: 45px;
    border-radius: var(--border-img-small-border-radius);
}

.plugin-item .icon-wrap svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    transform: rotateY(180deg);
    border-radius: var(--border-img-small-border-radius);
}

.plugin-item .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.plugin-item .center .title-action-wrap {
    width: 100%;
    position: relative;
}

.plugin-item .title-wrap,
.plugin-item .about {
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


.plugin-item .title-wrap {
    text-align: left;
    margin-top: 13px;
    margin-bottom: 6px;
    max-width: calc(100% - 168px);
}

.plugin-item .title-wrap span {
    word-wrap: break-word;
    line-break: anywhere;
}

.plugin-item .title-action-wrap .action {
    position: absolute;
    right: 20px;
    top: 13px;
    display: flex;
    align-items: center;
    cursor: default;
}

.plugin-item .title-action-wrap .action .delete-btn {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.plugin-item .center .about {
    width: calc(100% - 18px);
    color: var(--content-subtitle-text-color);
    font-size: var(--content-text-tip-text-size);
}
</style>