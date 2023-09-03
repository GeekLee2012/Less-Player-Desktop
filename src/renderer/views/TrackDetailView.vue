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

const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value

const playItem = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    playTrack(track)
    showToast('即将为您播放歌曲！')
}

const addItem = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    addTrack(track)
    showToast('歌曲添加成功！')
}

const playItemLater = () => {
    const track = routerCtxCacheItem.value
    if (!track) return
    playTrackLater(track)
    showToast('下一曲将为您播放！')
}
</script>

<template>
    <div id="track-detail-view">
        <div class="header">
            <div>
                <img class="cover" v-lazy="cover || 'default_cover.png'" />
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
                    <!--
                    <FavoriteShareBtn :favorited="false" :leftAction="() => { }" class="spacing">
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
            <div>
                <div class="info-row">
                    <span class="title">歌手：</span>
                    <div>
                        <ArtistControl :visitable="true" :platform="platform" :data="JSON.parse(artist)"></ArtistControl>
                    </div>
                </div>
                <div class="info-row">
                    <span class="title">专辑：</span>
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
    margin-bottom: 20px;
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
    padding-left: 15px;
    padding-right: 15px;
    margin-right: 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#track-detail-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#track-detail-view .info-row {
    display: flex;
    margin-bottom: 25px;
    text-align: left;
}

#track-detail-view .info-row .title {
    min-width: 88px;
}


#track-detail-view .info-row .artist-ctl {
    -webkit-line-clamp: 10;

}
</style>