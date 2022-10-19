<script setup>
import { onBeforeMount, onMounted } from 'vue';
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import { storeToRefs } from 'pinia';
import KeysInputControl from '../components/KeysInputControl.vue';
import SvgTextButton from '../components/SvgTextButton.vue';
import packageCfg from '../../../package.json';
import { useAppCommonStore } from '../store/appCommonStore';
import { useIpcRenderer } from '../../common/Utils';
import EventBus from '../../common/EventBus';
import { useRouter } from 'vue-router';

const router = useRouter()
const ipcRenderer = useIpcRenderer()

const { theme, track, keys, tray, navigation, dialog ,cache, other } = storeToRefs(useSettingStore())
const { setThemeIndex, 
        setTrackQualityIndex, 
        toggleVipTransfer,
        toggleCategoryBarRandom,
        togglePlayingWithoutSleeping,
        toggleStorePlayState,
        toggleStoreLocalMusic,
        toggleTrayShow,
        toggleCustomPlaylistsShow,
        toggleFavouritePlaylistsShow,
        toggleFollowArtistsShow,
        toggleKeysGlobal,
        updateBlackHole,
        allThemes, 
        allQualities
    } = useSettingStore()

const { showToast } = useAppCommonStore()

//TODO
const visitMoreTheme = () => {
    //router.push('/setting/themes')
} 

const visitLink = (url) => {
    if(ipcRenderer) ipcRenderer.send('visit-link', url)
}
</script>

<template>
    <div id="setting-view">
        <div class="title">设置</div>
        <div class="center">
            <div class="theme row">
                <b>主题</b>
                <div class="content">
                    <div class="last" v-for="(item,index) in allThemes()" 
                        :class="{ active: index == theme.index, lightText: item.dark }"
                        :style="{ background: item.bg }" 
                        @click="setThemeIndex(index)" >
                        <b>{{ item.name }}</b>
                    </div>
                    <div class="last more" @click="visitMoreTheme" >
                        <b>...</b>
                    </div>
                </div>
            </div>
            <div class="track row">
                <b>播放歌曲</b>
                <div class="content">
                    <div>
                        <b>优先音质：</b>
                        <span v-for="(item,index) in allQualities()"
                            :class="{ active: index == track.quality.index }"
                            @click="setTrackQualityIndex(index)" >
                            {{ item.name }}
                        </span>
                    </div>
                    <div>
                        <b>VIP歌曲尝试切换为免费版本：</b>
                        <ToggleControl @click="toggleVipTransfer" 
                            :value="track.vipTransfer">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>歌单分类栏，随机显示分类：</b>
                        <ToggleControl @click="toggleCategoryBarRandom" 
                            :value="track.categoryBarRandom">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <b>播放歌曲时，防止系统睡眠：</b>
                        <ToggleControl @click="togglePlayingWithoutSleeping" 
                            :value="track.playingWithoutSleeping">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="cache row">
                <b>缓存</b>
                <div class="content">
                    <div>
                        <b>应用退出前，保存播放状态：</b>
                        <ToggleControl @click="toggleStorePlayState"
                            :value="cache.storePlayState">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <b>应用退出前，保存本地歌曲：</b>
                        <ToggleControl @click="toggleStoreLocalMusic"
                            :value="cache.storeLocalMusic">
                        </ToggleControl>
                    </div>
                    <!--
                    <div class="last">
                        <SvgTextButton text="清空设置页缓存" :leftAction="() => clearSettingsCache()">
                        </SvgTextButton>
                        <span class="tip-text">（ 提示：版本更新时，由于缓存原因，导致新版本的设置可能没有生效。<br/>&nbsp;&nbsp;&nbsp;&nbsp;需手动清空缓存，刷新一下才生效。请放心操作，不会影响当前设置 ）</span>
                    </div>
                    -->
                </div>
            </div>
            <div class="menu row">
                <b>菜单栏</b>
                <div class="content">
                    <div class="last">
                        <b>在菜单栏（系统托盘）显示：</b>
                        <ToggleControl @click="toggleTrayShow"
                            :value="tray.show">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="navigation row">
                <b>导航栏</b>
                <div class="content">
                    <div>左侧导航栏显示：</div>
                    <div>
                        <b>创建的歌单：</b>
                        <ToggleControl @click="toggleCustomPlaylistsShow"
                            :value="navigation.customPlaylistsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>收藏的歌单：</b>
                        <ToggleControl @click="toggleFavouritePlaylistsShow"
                            :value="navigation.favouritePlaylistsShow">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <b>关注的歌手：</b>
                        <ToggleControl @click="toggleFollowArtistsShow"
                            :value="navigation.followArtistsShow">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="dialog row" style="display: none;">
                <b>对话框</b>
                <div class="content">
                    <div>当进行如下操作时，需要确认：</div>
                    <div>
                        <b>清空当前播放：</b>
                        <ToggleControl @click=""
                            :value="dialog.clearQueue">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>批量添加：</b>
                        <ToggleControl @click=""
                            :value="dialog.batchAdd">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>批量移动：</b>
                        <ToggleControl @click=""
                            :value="dialog.batchMove">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>批量删除：</b>
                        <ToggleControl @click=""
                            :value="dialog.batchDelete">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>数据还原：</b>
                        <ToggleControl @click=""
                            :value="dialog.restore">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>数据重置：</b>
                        <ToggleControl @click=""
                            :value="dialog.reset">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <b>应用退出：</b>
                        <ToggleControl @click=""
                            :value="dialog.quit">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="keys row">
                <b>快捷键</b>
                <div class="content">
                    <div>
                        <b>开启全局快捷键：</b>
                        <ToggleControl @click="toggleKeysGlobal"
                            :value="keys.global" >
                        </ToggleControl>
                        <SvgTextButton text="恢复默认" style="display: none"></SvgTextButton>
                    </div>
                    <div v-for="(item,index) in keys.data"
                        :class="{ last: index == (keys.data.length - 1) }" >
                        <b>{{ item.name }}：</b>
                        <KeysInputControl :value="item.binding" :class="{ keysInputAdptWidth: !keys.global }"></KeysInputControl>
                        <KeysInputControl :value="item.gBinding" class="global-keys-ctrl" v-show="keys.global"></KeysInputControl>
                    </div>
                </div>
            </div>
            <div class="data row">
                <b>数据</b>
                <div class="content">
                    <div class="last">
                        <SvgTextButton text="备份" :leftAction="null">
                        </SvgTextButton>
                        <SvgTextButton text="还原" :leftAction="null" class="spacing">
                        </SvgTextButton>
                        <SvgTextButton text="重置" :leftAction="null" class="spacing">
                        </SvgTextButton>
                    </div>
                </div>
            </div>
            <div class="row">
                <b>版本</b>
                <div class="content">
                    <div class="last">
                        <span>{{ packageCfg.version }}</span>
                        <a href="#" @click.prevent="visitLink('https://gitee.com/rive08/less-player-desktop/blob/master/CHANGELOG.md')" class="spacing link">更新日志</a>
                    </div>
                </div>
            </div>
            <div class="about row last-row">
                <b>关于</b>
                <div class="content">
                    <div>
                        <b>开发者：</b>
                        <span>RIVE2012</span>
                    </div>
                    <div class="repository">
                        <div><b>访问源码：</b></div>
                        <div @click.prevent="visitLink('https://github.com/GeekLee2012/Less-Player-Desktop/')">
                            <!--
                            <svg width="21" height="21" viewBox="0 0 887.63 729.14" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M449.7,519H436.94v7c0,38.49.27,77-.29,115.47a274.62,274.62,0,0,1-4,40.72c-3.81,23-30.6,45.61-53.93,46.47-4,.15-8.32,0-10.19-4.59-1.63-3.93.13-7.33,3.11-9.78,11.85-9.69,15.75-22.91,16-37.33.83-50.31,1.3-100.63,1.89-151,0-.79-.15-1.57-.38-3.75-2.81,3.17-5.1,5.26-6.79,7.75-5.31,7.8-7.58,16.62-7.65,26-.27,35.16-.86,70.33-.43,105.49.19,15.38-6.25,26.19-18.3,34.39-15.42,10.51-32.44,15.36-51.1,12.9-3.13-.41-6-2.71-9-4.13,1.55-3,2.46-6.6,4.76-8.76,4.72-4.42,10.19-8,15.32-12,10.23-7.94,15.63-17.76,15.19-31.34-.77-23.31-.37-46.66-.45-70,0-1.79,0-3.58,0-5.88-6.72.65-12.81,1.4-18.91,1.79-17.31,1.12-34.64,2-51.76-1.82-29.85-6.66-50.12-25-63-52.15-2.49-5.26-4.72-10.64-7.19-15.92a109.74,109.74,0,0,0-39.66-45.91c-2.92-1.92-6.06-3.77-8.3-6.35-1.9-2.19-4.12-5.78-3.51-8s4.39-4.4,7.13-5c13.42-3,26.65-1.51,37.69,6.75,9.1,6.82,17.2,15.13,25,23.51,7.1,7.68,13.23,16.29,19.65,24.59,11.62,15,26.59,23.6,45.76,25.23,19.38,1.65,38.24.63,56.26-7.47,3.29-1.48,4.92-3.52,5.63-7.28,3.42-18.3,13.64-32.63,27.17-44.88,1.1-1,2.24-1.94,4.29-3.71-5.84-.75-10.78-1.36-15.71-2-40.45-5.44-79.44-15.3-114.2-37.84a159.38,159.38,0,0,1-51.41-53.63c-.94-1.6-3.46-3.3-5.19-3.25-41,1.18-81.86,4-121.74,14.65-16.56,4.41-33.07,9-49.6,13.52-1.45.4-3,1.16-4.35.95S2.08,391,.81,390.19c.73-1.15,1.22-2.92,2.25-3.33a66,66,0,0,1,8.63-2.42c24.5-6.23,48.85-13.17,73.54-18.5,29.39-6.35,59.44-7.56,89.42-8.77,1.64-.07,3.27-.19,5.47-.31-2.26-5.39-4.19-10.49-6.59-15.34-.49-1-2.78-1.55-4.21-1.49-29.45,1.37-59,2-88.33,4.58-25.32,2.24-50.44,6.81-75.67,10.15-1.66.22-3.54-1.28-5.32-2,1.4-1.31,2.66-3.54,4.22-3.78,22.86-3.5,45.67-7.69,68.67-9.81,32.32-3,64.79-4.39,97-6.46-2.4-10.3-5.64-21.32-7.49-32.56-5.72-34.71-7.69-69.54-.64-104.35,4.15-20.47,13.7-38.45,26-55.07,3.88-5.21,7.72-10.47,11.92-15.42,2.42-2.85,2.79-5.42,1.86-9-8.29-32.13-8.47-64.23,1.15-96.16,1.34-4.45,3.54-8.65,4.72-13.13,1.26-4.75,4.33-5.57,8.54-5.53,16.07.15,31.25,4.35,46.1,10,23.35,8.89,44.62,21.57,65,35.87a7.25,7.25,0,0,0,7.65,1c19.25-7,39.42-9.53,59.67-11.38a498.19,498.19,0,0,1,95.84.15c15.85,1.62,31.56,4.82,47.27,7.61a10.51,10.51,0,0,0,8.3-1.46C571,27.45,596.93,13.2,625.51,4.6,634,2,643.09,1.21,652,.11c5.43-.68,9.13,1.8,11.53,7.27,9,20.54,11,42.12,9.8,64.08-.68,12.45-2.74,24.81-3.89,37.24a10,10,0,0,0,1.82,6.28c6,8.2,12.62,16,18.44,24.26,19.06,27.24,28,58,30.05,90.82a337.44,337.44,0,0,1-8.8,99.67c-.3,1.25-.44,2.54-.72,4.23H741A665.71,665.71,0,0,1,882.8,348.82c.32.07.77,0,1,.16,1.32,1.2,2.58,2.46,3.86,3.7-1.59.77-3.3,2.38-4.76,2.17-7.24-1-14.43-2.47-21.61-3.91C814,341.45,766.05,339.77,718,340c-9.64,0-9.64.08-12.84,9l-2.85,8.05c10.28.61,20.05,1.13,29.82,1.78A653.33,653.33,0,0,1,880.67,385.8c1.73.53,4.36,3,4.14,4.13-.71,3.69-3.8,2.17-6.06,1.49A662.29,662.29,0,0,0,749,366.36c-15.42-1.43-30.92-2.08-46.39-2.87-1.4-.07-3.66,1.05-4.22,2.24-21,44.53-58.59,67.5-104.1,80.17-23.81,6.62-48.14,10.34-72.66,13.06-.95.11-1.91.24-3.44.44.65.85.9,1.44,1.35,1.73,21.74,13.78,31.1,34.66,34.35,59.23,4,30.54,2.54,61.22,2.59,91.86,0,14.33-.23,28.67-.66,43-.29,9.64,3,17.8,9.86,24.21,6.31,5.89,13.44,10.9,19.89,16.66,2.28,2,3.63,5.11,5.41,7.72-2.79,1.53-5.45,4.09-8.38,4.42-21.32,2.4-41.32-.76-57.51-16.33-8.69-8.37-12.41-18.89-12.54-31-.39-36.32-.91-72.65-2-109-.2-6.79-2.73-13.62-4.83-20.22-1.16-3.66-4-6.45-9-6.85-.09,2-.23,3.71-.23,5.45,0,45.16.15,90.33-.11,135.49-.08,14.82,4,27.84,13.19,39.4a89.9,89.9,0,0,1,6.9,9.79c2.06,3.43,2.83,7.3.43,10.88s-6.37,3.79-9.94,2.82c-29.29-8-51.75-23.39-55.15-54.81-1.3-12.07-2.06-24.24-2.15-36.37-.26-37.33-.07-74.67-.06-112Zm-1.94-79c0-.43,0-.86,0-1.3,17.49,0,35,.22,52.48,0,23.86-.37,47.58-2.25,70.69-8.73,22.65-6.35,43.37-16.24,59.6-33.8C651.47,373.51,658.39,346,657.91,316c-.84-52.11-33.27-89.91-84.54-99.22-21-3.81-41.84-2-62.75-.46-43.79,3.23-87.56,2.55-131.36.15-21.08-1.16-42.15-3.93-63.32-.55-30.2,4.81-55.53,17.73-73.94,42.89-32.64,44.57-21.6,116.83,30.24,149.74,28.19,17.9,59.46,25.83,92.14,28.21C392.1,438.79,420,439,447.76,440ZM199.1,484.39c2.86-2.77,6.17-4.47,6.39-6.51.41-3.77-3.46-4.41-6.44-4.43s-6.84.75-6.44,4.46C192.82,479.94,196.19,481.63,199.1,484.39Zm91.43,57.36c3-2.62,6.53-4.21,6.8-6.23.47-3.61-3.14-4.54-6.33-4.6s-6.81.74-6.66,4.28C284.43,537.18,287.8,539,290.53,541.75ZM164.17,457.14c3.07-2.67,6.48-4.21,6.81-6.24.6-3.75-3.33-5-6.17-4.56-2.49.41-4.68,2.7-7,4.16Zm21.54,11.63c3-2.64,6.46-4.25,6.72-6.28.48-3.65-3.15-4.51-6.32-4.57s-6.81.75-6.62,4.31C179.59,464.21,183,466,185.71,468.77Zm24.74,33.16c2.92-2.72,6.3-4.39,6.52-6.4.41-3.66-3.28-4.49-6.39-4.5s-6.8.77-6.48,4.41C204.27,497.44,207.61,499.17,210.45,501.93Zm13.25,16.64c2.83-2.76,6.2-4.52,6.37-6.55.3-3.65-3.42-4.39-6.53-4.34s-6.85.7-6.39,4.45C217.41,514.19,220.79,515.86,223.7,518.57Zm92,19.24c2.89-2.67,6.37-4.38,6.53-6.36.28-3.54-3.33-4.48-6.51-4.47s-6.81.89-6.51,4.46C309.4,533.42,312.85,535.14,315.72,537.81ZM266,529c-2.85,2.72-6.26,4.45-6.42,6.44-.29,3.58,3.39,4.47,6.52,4.44s6.8-.86,6.42-4.51C272.26,533.38,268.86,531.71,266,529Zm-24.66,3.72c2.85-2.79,6.13-4.5,6.37-6.56.45-3.8-3.32-4.37-6.37-4.37s-6.82.57-6.37,4.38C235.16,528.24,238.44,529.94,241.29,532.73Z"/><path d="M144.79,471.34c2.07,8.47,4.6,16.86,6.06,25.44.9,5.27-2.07,7.59-7.41,7.46-4.43-.1-7.14-2.23-6.71-6.75a80.78,80.78,0,0,1,2.46-12.67c1.17-4.49,2.77-8.86,4.18-13.28Z"/><path d="M283.59,316.26c.3-17.22,4.36-35,17.11-49.7,15.84-18.21,37-18.13,53-.18,21.84,24.54,23.05,73.17,2.45,98.08C340,384,314,384,298.07,364.19,287.22,350.73,283.7,334.87,283.59,316.26Z"/><path d="M607,316.08c-.35,19.12-3.84,35.15-15,48.63-15.89,19.16-41.54,19.12-57.42,0-8.58-10.33-12.82-22.47-14.23-35.6-2.1-19.69.58-38.56,11.34-55.61a57.4,57.4,0,0,1,9.58-11.4c13.31-12.22,30.77-12.17,44.17,0,12.18,11,17.75,25.44,20.33,41.22C606.54,308.17,606.72,313.18,607,316.08Z"/><path d="M442.05,418c-10.23-.05-18.13-4.67-24.06-12.78a11.3,11.3,0,0,1-2.39-5.37c-.11-1.56,1.21-3.22,1.9-4.83,1.24,1,3.06,1.81,3.62,3.12,4.59,10.69,17.28,16.64,28.08,12.73,5.76-2.08,9.91-5.8,11.53-12.08.37-1.46,2.25-2.54,3.43-3.79.8,1.74,2.46,3.59,2.25,5.19-1.15,8.91-10.68,16.83-20.88,17.8C444.38,418.05,443.21,418,442.05,418Z"/><path d="M452.16,372.23A10.36,10.36,0,0,1,442,383a10.49,10.49,0,0,1-.47-21A10.35,10.35,0,0,1,452.16,372.23Z"/></g></g></svg>
                            -->
                            <svg width="17" height="17" viewBox="0 0 896.57 896.13" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M530.94,661.76c9.72-1.55,20.09-3,30.37-4.87,29-5.35,56.87-13.91,82.47-28.93,34.06-20,58.17-48.61,72-85.41,17.43-46.46,22-94.58,14.29-143.53-4.89-31.28-18.72-58.83-39.16-83-2.4-2.84-3-5.13-1.83-8.86,11.22-34.68,9-69.25-1.37-103.68-.39-1.28-.85-2.53-1.28-3.79-3.61-10.76-4-11.08-15.5-10.44a129.51,129.51,0,0,0-51.66,14.21c-18.8,9.55-36.85,20.61-55.08,31.25-3,1.73-5.36,2.33-8.77,1.42C506.13,223,456,218.6,405.37,224.37c-21.76,2.48-43.23,7.56-64.76,11.81-3.63.72-6.2.37-9.2-1.67-24.46-16.6-49.88-31.4-78.41-40-11.84-3.57-23.86-6.12-36.39-4.87-2.8.28-4.43,1.19-5.44,4-13.43,38.1-17,76.51-4.17,115.58a6.28,6.28,0,0,1-1.11,5.15c-34.63,40.19-46.48,87.38-43.47,139.33,1.64,28.22,5.51,56,15,82.75,20.12,56.56,60.27,92,116.48,110.58,22.55,7.44,45.74,11.75,69.22,14.81.62.08,1.23.23,2.57.49-8.9,8.71-15.67,18.39-19.59,29.61-3.23,9.23-5.28,18.86-8,28.26-.45,1.55-1.37,3.65-2.63,4.18-25.86,11-52.27,15.86-79.58,5.66-21-7.82-35.64-22.95-46.76-41.78-8.78-14.85-19.45-27.91-34-37.39-14-9.13-29-14.94-46.19-12a24,24,0,0,0-4.8,1.3c-6.05,2.4-7.74,6.72-3.62,11.69,4,4.81,8.56,9.55,13.8,12.84,20.41,12.81,33.76,31.35,44.07,52.46,5,10.15,8.5,21.07,14.13,30.81,17.73,30.63,45.39,46.51,79.92,50.74a181.82,181.82,0,0,0,31.91.72c10.43-.57,20.77-2.62,31.79-4.1.09,1.48.29,3.19.3,4.91.22,23.5.47,47,.6,70.49.11,19.5-14.42,29.89-33,23.45a429.5,429.5,0,0,1-128.92-70.85C87.5,753.23,31,663.11,9.8,553c-28.65-148.76,5.39-282.82,103.76-398.79,59-69.58,133.7-115.82,222-139.57,49.52-13.33,99.89-17.33,151-13,187.9,15.94,347.67,152.93,394.17,339.6,38.12,153,7.54,292.8-92,415.79-52,64.23-118.34,109.22-196.38,136.71a29.35,29.35,0,0,1-19.14.58c-8.52-2.76-12.88-9.07-14.08-17.68a59.85,59.85,0,0,1-.28-8.48q.18-60,.42-120c.1-21.4-2.63-42.31-12.39-61.59C542.47,678,536.4,670.17,530.94,661.76Z"/></g></g></svg>
                            <span>Github</span>
                        </div>
                        <div class="spacing" @click.prevent="visitLink('https://gitee.com/rive08/less-player-desktop/')">
                            <svg width="15" height="15" viewBox="0 0 49.87 49.82" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><g id="Layer_2-2" data-name="Layer 2"><g id="Layer_1-2-2" data-name="Layer 1-2"><g id="LOGO"><g id="Artboard"><g id="logo-black"><g id="Group"><path id="G" class="cls-1" d="M47.62,19.93H22.15a2.21,2.21,0,0,0-2.22,2.2v5.55a2.21,2.21,0,0,0,2.2,2.22H37.65a2.23,2.23,0,0,1,2.22,2.21h0v.56h0v.55a6.65,6.65,0,0,1-6.65,6.65h-21A2.21,2.21,0,0,1,10,37.65h0v-21A6.65,6.65,0,0,1,16.65,10h31a2.21,2.21,0,0,0,2.22-2.2h0V2.21A2.21,2.21,0,0,0,47.66,0h-31A16.6,16.6,0,0,0,0,16.54V47.61a2.21,2.21,0,0,0,2.21,2.21H34.88A15,15,0,0,0,49.83,34.88V22.15a2.21,2.21,0,0,0-2.2-2.22Z"/></g></g></g></g></g></g></g></g></svg>
                            <span>Gitee</span>
                        </div>
                    </div>
                    <div class="license last">
                        <b>开源许可证：</b>
                        <span @click="visitLink('https://www.apache.org/licenses/LICENSE-2.0.html')">Apache License 2.0</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#setting-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: auto;
}

#setting-view .tip-text {
    font-size: 14px;
    margin-left: 15px;
    color: var(--text-sub-color);
}

#setting-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 25px;
    font-size: 30px;
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center .last-row {
    border-color: transparent;
}

#setting-view .center .row > b {
    font-size: 16.5px;
    font-size: 17px;
    margin-left: 10px;
    font-weight: bold;
    width: 125px;
    font-weight: normal;
}

#setting-view .content, 
#setting-view .content > div,
#setting-view .keys-input-ctl  {
    flex: 1;
}

#setting-view .content > div {
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .content > div b {
    width: 215px;
    font-weight: normal;
}

#setting-view .content .last {
    margin-bottom: 0px;
}

#setting-view .theme {
    padding-bottom: 10px !important;
}

#setting-view .theme .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

#setting-view .theme .content div {
    --size: 50px;
    width: var(--size);
    max-width: var(--size);
    height: var(--size);
    border-radius: 5px;
    box-shadow: 0px 0px 10px #212121;
    text-align: center;
    margin-right: 23px;
    margin-bottom: 25px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid transparent;
    /* flex: 1; */
}

#setting-view .theme .content div b {
    background-color: #16161656;
    line-height: var(--size);
    border-radius: 5px;
    visibility: hidden;
}

#setting-view .theme .content div:hover b{
    visibility: visible;
}

#setting-view .theme .content .active {
    border-color: #ffd700;
}

#setting-view .theme .content .lightText {
    color: #fff !important;
}

#setting-view .theme .content .more {
    background: #ffd700;
}

#setting-view .theme .content .more b {
    /* visibility: visible; */
    background-color: transparent;
    color: #333;
    font-size: 28px;
    padding-bottom: 15px;
}

#setting-view .track .content span {
    width: 56px;
    padding: 6px;
    text-align: center;
    border-radius: 10rem;
    margin-right: 20px;
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#setting-view .track .content span:hover {
    background-color: var(--border-color);
    background-color: var(--list-item-hover);
}

#setting-view .track .content .active {
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
    /*border: 1px solid var(--border-color);*/
}

#setting-view .keys .global-keys-ctrl {
    margin-left: 50px;
}

#setting-view .keys .svg-text-btn {
    margin-left: 188px;
}

#setting-view .about .content b {
    width: auto;
    margin-right: 6px;
}

#setting-view .center .repository div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .repository svg {
    fill: var(--text-color);
    cursor: pointer;
}

#setting-view .repository span,
#setting-view .license span {
    text-decoration: underline;
    cursor: pointer;
    color: var(--text-color);
    padding-left: 5px;
}


#setting-view .keys-input-ctl input {
    min-width: 159px;
    width: 93.5%;
    padding: 8px;
}

#setting-view .keysInputAdptWidth input{
    width: 42%;
}

#setting-view .center .spacing {
    margin-left: 25px;
}

#setting-view .link {
    color: var(--hl-color);
    color: var(--text-color);
}
</style>