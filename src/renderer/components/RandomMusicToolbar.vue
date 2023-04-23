<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import ToggleControl from './ToggleControl.vue';



const { hideRandomMusicToolbar } = useAppCommonStore()
const { platforms, randomMusicTypes } = storeToRefs(usePlatformStore())
const { isActiveRandomMusicPlatform, isActiveRandomMusicType,
    randomMusicToolbarShow } = storeToRefs(useAppCommonStore())
const { toggleRandomMusicPlatform, toggleRandomMusicType } = useAppCommonStore()

const navIndex = ref(0)

const setNavIndex = (index) => {
    navIndex.value = index || 0
}

watch(randomMusicToolbarShow, () => setNavIndex(0))
</script>

<template>
    <div class="random-music-toolbar" v-gesture-dnm="{ trigger: '.header' }">
        <div class="header">
            <div class="close-btn">
                <svg @click="hideRandomMusicToolbar" width="10" height="10" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                        transform="translate(-663.4 -243.46)" />
                </svg>
            </div>
            <div class="title">随机设置</div>
        </div>
        <div class="center">
            <div class="nav-wrap">
                <div v-for="(item, index) in ['平台', '类型']" class="nav-item" :class="{ active: (index == navIndex) }"
                    @click="setNavIndex(index)">
                    {{ item }}
                </div>
            </div>
            <div class="content-wrap v-spacing">
                <div class="content platform" v-show="navIndex == 0">
                    <div v-for="(item, index) in platforms('random')" class="row" :class="{ 'v-spacing': index > 0 }">
                        <span>{{ item.name }}：</span>
                        <ToggleControl :value="isActiveRandomMusicPlatform(item.code)"
                            @click="() => toggleRandomMusicPlatform(item.code)">
                        </ToggleControl>
                    </div>
                </div>
                <div class="content type" v-show="navIndex == 1">
                    <div v-for="(item, index) in randomMusicTypes" class="row" :class="{ 'v-spacing': index > 0 }">
                        <span>{{ item.name }}：</span>
                        <ToggleControl :value="isActiveRandomMusicType(item.code)"
                            @click="() => toggleRandomMusicType(item.code)">
                        </ToggleControl>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.random-music-toolbar {
    background: var(--seview-bg);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    /*width: 299px;
    height: 404px;*/
    width: 314px;
    height: 413px;
    -webkit-app-region: none;
    overflow: hidden;
}

.random-music-toolbar .v-spacing {
    margin-top: 20px;
}

.random-music-toolbar svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.random-music-toolbar svg:hover {
    fill: var(--hl-color);
}

.random-music-toolbar .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: var(--seview-border);
    padding: 8px 10px;
    border-radius: 5px 5px 0px 0px;
}

.random-music-toolbar .header .title {
    flex: 1;
    font-weight: bold;
    padding-right: 9px;
}

.random-music-toolbar .center {
    display: flex;
    flex: 1;
    background: var(--seview-bg);
    overflow: hidden;
}

.random-music-toolbar .center .nav-wrap {
    background: var(--seview-left-bg);
    width: 56px;
    overflow: hidden;
}

.random-music-toolbar .center .nav-wrap .active {
    background: var(--list-item-active-bg) !important;
    color: var(--svg-btn-color);
}

.random-music-toolbar .center .nav-item {
    padding: 30px 1px;
    cursor: pointer;
    margin-bottom: 0px;
}

.random-music-toolbar .center .content-wrap {
    flex: 1;
    overflow: scroll;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.random-music-toolbar .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
}

.random-music-toolbar .row span {
    width: 100px;
    width: 125px;
}
</style>