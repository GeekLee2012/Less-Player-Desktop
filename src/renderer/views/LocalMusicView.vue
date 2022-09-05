<script setup>
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import AddFolderFileBtn from '../components/AddFolderFileBtn.vue';
import BatchDeleteBtn from '../components/BatchDeleteBtn.vue';
import { usePlayStore } from '../store/playStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { storeToRefs } from 'pinia';

const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { localDirs, localTracks, isLoading } = storeToRefs(useLocalMusicStore())
const { addFolders, addFiles, resetAll, removeItem } = useLocalMusicStore()

const playAll = () => {
    if(noTracks()) return
    resetQueue()
    addAll()
    playNextTrack()
}

const addAll = () => {
    if(noTracks()) return
    addTracks(localTracks.value)
}

const batchDelete = () => {
   //TODO
}

const noTracks = () => (localTracks.value.length < 1)

</script>

<template>
    <div id="local-music">
        <div class="header">
            <div>
                <img class="cover" src="/default_cover.png" />
            </div>
            <div class="right">
                <div class="title">本地歌曲</div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll" :rightAction="addAll" ></PlayAddAllBtn>
                    <AddFolderFileBtn :leftAction="addFolders" :rightAction="addFiles" class="spacing"></AddFolderFileBtn>
                    <BatchDeleteBtn :leftAction="batchDelete" :rightAction="resetAll" class="spacing"></BatchDeleteBtn>
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
                <div v-for="(item, index) in localTracks">
                    <SongItem :index="index" :data="item"
                        :artistVisiable="false"
                        :albumVisiable="false" 
                        :deleteFn="removeItem">
                    </SongItem>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#local-music {
    display: flex;
    flex-direction: column;
    padding: 25px;
    overflow: auto;
    flex: 1;
}

#local-music .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#local-music .header .cover {
    width: 150px;
    height: 150px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#local-music .header .right {
    flex: 1;
    margin-left: 20px;
}

#local-music .header .title{
    text-align: left;
    margin-top: 5px;
    font-size: 25px;
    font-weight: bold;
}

#local-music .header .action {
    margin-top: 30px;
    display: flex;
}

#local-music .header .spacing {
    margin-left: 20px;
}

#local-music .list-title {
    margin-bottom: 15px;
    text-align: left;
    font-size: 18px;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#local-music .empty-tip,
#local-music .loading-tip {
    margin-top: 66px;
    font-size: 18px;
    line-height: 28px;
    color: var(--text-sub-color);
}

#local-music .songlist {
    display: flex;
    flex-direction: column;
}

#local-music .artist span,
#local-music .album span {
    cursor: default;
    color: #eee;
}

#local-music .songlist .title:hover .delete-btn {
    visibility: visible;
}

</style>