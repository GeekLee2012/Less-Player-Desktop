<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'TrackDetailView'
}
</script>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import ArtistControl from '../components/ArtistControl.vue';
import AlbumControl from '../components/AlbumControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { coverDefault, ipcRendererSend, transformPath } from '../../common/Utils';
import { usePlatformStore } from '../store/platformStore';




const props = defineProps({
    id: String,
    platform: String,
    title: String,
    cover: String,
    artist: String,
    album: String,
})

const { playTrack, addTrack, playTrackLater } = usePlayStore()
const { routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const { showToast } = useAppCommonStore()
const { isLocalMusic } = usePlatformStore()

const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value

const playItem = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    playTrack(track)
    showToast('即将为您播放歌曲')
}

const addItem = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    addTrack(track)
    showToast('歌曲添加成功')
}

const playItemLater = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    playTrackLater(track)
    showToast('下一曲将为您播放')
}

const showInFolder = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    const { platform, url } = track
    
    if(!isLocalMusic(platform) || !url) return 
    ipcRendererSend('path-showInFolder', transformPath(url))
}
</script>

<template>
    <div id="track-detail-view">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(cover)" />
            </div>
            <div class="right">
                <div class="title" v-html="title"></div>
                <div class="action">
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playItem" :rightAction="addItem" class="spacing">
                    </PlayAddAllBtn>
                    <SvgTextButton text="下一曲播放" :leftAction="playItemLater" class="spacing">
                        <template #left-img>
                            <svg width="18" height="18" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z" />
                                        <path
                                            d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z" />
                                    </g>
                                </g>
                            </svg>
                        </template>
                    </SvgTextButton>
                    <SvgTextButton text="查看目录" :leftAction="showInFolder" v-show="isLocalMusic(platform)" class="folder-btn">
                        <template #left-img>
                            <svg width="18" height="18" viewBox="0 0 870.27 700.5" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,604.32V99.2c.67-3.86,1.41-7.71,2-11.59C9.18,39,52.75.55,101.7.25,159-.11,216.36,0,273.69,0c25.8,0,48.64,8.41,68.48,24.88q46.9,39,93.69,78.06a14.83,14.83,0,0,0,10.38,3.78q28.74-.34,57.48-.37c55,0,110-.11,165,.07a207.6,207.6,0,0,1,30.85,2,101.72,101.72,0,0,1,85.67,95c.56,10.25.9,20.52,1.35,31,2.09.24,3.89.51,5.7.64,51.39,3.65,86.9,50.22,76,100.61-5.36,24.87-12,49.46-18.2,74.16q-28.44,113.81-57,227.57c-9.72,38.4-42,62.93-81.62,63-30.5,0-61,.16-91.49.15l-515-.15c-48.08,0-88.76-31.22-101.1-77.7C2.32,616.62,1.29,610.43,0,604.32Zm104.9,13.85c2.46.13,4.26.31,6,.31q298.5,0,597,.11c4.42,0,6-1.5,7-5.54Q751,468.21,787.3,323.43c1.69-6.77,1.49-7-5.6-7H201.2c-14.52,0-22.59,6.36-26.11,20.43q-31.43,125.67-62.85,251.35C109.79,598,107.43,607.83,104.9,618.17ZM704.49,234.73c0-7.11.21-13.26,0-19.39-.79-19.31-8.81-26.93-28-27q-61.73-.07-123.47-.16-61.49,0-123,.2c-13.46,0-25-4.5-35.23-13.06Q343,132.08,291.12,88.94c-5-4.16-10.57-7-17.22-7-15.15,0-30.3.07-45.46.08Q168.2,82,108,82c-16.46,0-25.72,9.19-25.78,25.59-.07,20.66-.16,41.32-.16,62q0,96.5,0,193v5.25a10.3,10.3,0,0,0,2-4.52C87.7,348.64,91.61,334,95,319.24c12.35-54.39,57.58-84.92,108.68-84.74,164.3.6,328.61.23,492.91.23Z"/></g></g></svg>
                        </template>
                    </SvgTextButton>
                    <!--
                    <FavoriteShareBtn class="spacing"
                        :favorited="false" 
                        :leftAction="() => { }" 
                        :hiddenShare="true" >
                    </FavoriteShareBtn>
                    -->
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title" v-show="isLoading">
                    <div class="loading-mask" style="width: 88%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="action">
                    <div class="loading-mask spacing" v-for="i in 2"
                        style="width: 168px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab content-text-highlight active">详情</span>
            </div>
            <div class="info-wrap">
                <div class="info-row">
                    <b class="title">歌手：</b>
                    <div>
                        <ArtistControl :visitable="true" :platform="platform" :data="JSON.parse(artist)"></ArtistControl>
                    </div>
                </div>
                <div class="info-row">
                    <b class="title">专辑：</b>
                    <div>
                        <AlbumControl :visitable="true" :platform="platform" :data="JSON.parse(album)"></AlbumControl>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#track-detail-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#track-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 16px;
}

#track-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#track-detail-view .header .title {
    text-align: left;
    margin-top: 0px;
    /*font-size: 30px;
    height: 128px;*/
    height: 113px;
    margin-bottom: 15px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;

    overflow: hidden;
    word-wrap: break-word;
    /*white-space: pre-wrap;*/
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
}

#track-detail-view .header .cover {
    width: 168px;
    height: 168px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#track-detail-view .action {
    display: flex;
    flex-direction: row;
}

#track-detail-view .action .folder-btn svg {
    transform: translateY(1px);
}

#track-detail-view .spacing {
    margin-right: 20px;
}

#track-detail-view .tab-nav {
    position: relative;
    display: flex;
    height: 36px;
    margin-bottom: 25px;
    border-bottom: 1px solid transparent;
}

#track-detail-view .tab {
    font-size: var(--content-text-tab-title-size);
    /*padding-left: 15px;
    padding-right: 15px;
    margin-right: 15px;
    */
    margin-right: 36px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#track-detail-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#track-detail-view .info-wrap {
    margin-left: 2px;
}

#track-detail-view .info-row {
    display: flex;
    margin-bottom: 25px;
    text-align: left;
}

#track-detail-view .info-row b {
    color: var(--content-subtitle-text-color);
}

#track-detail-view .info-row .title {
    min-width: 88px;
}


#track-detail-view .info-row .artist-ctl {
    -webkit-line-clamp: 10;

}
</style>