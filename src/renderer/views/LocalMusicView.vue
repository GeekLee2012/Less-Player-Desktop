<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'LocalMusicView'
}
</script>

<script setup>
import { inject, onMounted, ref } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import AddFolderFileBtn from '../components/AddFolderFileBtn.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import { usePlayStore } from '../store/playStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';



const { visitBatchLocalMusic } = inject('appRoute')

const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { localDirs, localTracks, isLoading } = storeToRefs(useLocalMusicStore())
const { addFolders, addFiles, resetAll, removeItem } = useLocalMusicStore()
const { showToast, hideAllCtxMenus } = useAppCommonStore()
const localMusicRef = ref(null)
const back2TopBtnRef = ref(null)

const playAll = () => {
    if (noTracks()) return
    resetQueue()
    addAll("即将为您播放全部！")
    playNextTrack()
}

const addAll = (text) => {
    if (noTracks()) return
    addTracks(localTracks.value)
    showToast(text || "歌曲已全部添加！")
}

const noTracks = () => (localTracks.value.length < 1)

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(localMusicRef.value)
}

const onScroll = () => {
    hideAllCtxMenus()
}

onMounted(resetBack2TopBtn)
</script>

<template>
    <div id="local-music-view" ref="localMusicRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" src="/default_cover.png" />
            </div>
            <div class="right">
                <div class="title">本地歌曲</div>
                <div class="about">
                    <p>目前支持的音频格式有：.mp3、.flac、.ogg、.wav、.aac、.m4a</p>
                    <p>最近播放功能，暂时不支持记录本地歌曲</p>
                    <p>此功能仅供试用体验，暂时还没有完善~</p>
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll" :rightAction="() => addAll()"></PlayAddAllBtn>
                    <AddFolderFileBtn :leftAction="addFolders" :rightAction="addFiles" class="spacing">
                    </AddFolderFileBtn>
                    <BatchActionBtn :deleteBtn="true" :leftAction="visitBatchLocalMusic" :rightAction="resetAll"
                        class="spacing"></BatchActionBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">歌曲({{ localTracks.length }})</div>
            <!--
                    <div class="empty-tip" v-show="localTracks.length < 1"><p>爱丫丫，空空如也~<br>快来添加些歌曲吧~</p></div>
                    <div class="loading-tip" v-show="isLoading"><p>添加歌曲中，请稍候......</p></div>
                    -->
            <div class="songlist">
                <SongListControl :data="localTracks" :artistVisiable="false" :albumVisiable="false" :deleteFn="removeItem"
                    :dataType="1">
                </SongListControl>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#local-music-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 28px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#local-music-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#local-music-view .header .cover {
    width: 233px;
    height: 233px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#local-music-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#local-music-view .header .title {
    text-align: left;
    margin-top: 5px;
    margin-bottom: 20px;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
}

#local-music-view .header .about {
    text-align: left;
    margin-bottom: 20px;
    line-height: 23px;
    color: var(--text-sub-color);

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
}

#local-music-view .header .action {
    display: flex;
}

#local-music-view .header .spacing {
    margin-left: 20px;
}

#local-music-view .list-title {
    margin-bottom: 15px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#local-music-view .empty-tip,
#local-music-view .loading-tip {
    margin-top: 66px;
    font-size: 18px;
    line-height: 28px;
    color: var(--text-sub-color);
}

#local-music-view .songlist {
    display: flex;
    flex-direction: column;
}

#local-music-view .artist span,
#local-music-view .album span {
    cursor: default;
    color: var(--text-color) !important;
}

#local-music-view .songlist .title:hover .delete-btn {
    visibility: visible;
}
</style>