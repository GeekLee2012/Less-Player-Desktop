<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'PlaylistDetailView'
}
</script>
-->

<script setup>
import { onMounted, onActivated, reactive, ref, watch } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';

const { getVender } = usePlatformStore()
const { addTracks, resetQueue, playNextTrack } = usePlayStore()

const props = defineProps({
    platform: String,
    id: String
})

const detail = reactive({})
const listSize = ref(0)
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0
let page = 1
let limit = 1000
let markScrollTop = 0

const loadContent = () => {
    const vender = getVender(props.platform)
    if(vender) {
        vender.playlistDetail(props.id, offset, limit, page).then(result => {
            console.log(result)
            Object.assign(detail, result)
            listSize.value = detail.data.length
        })
    }
}

const playAll = () => {
    resetQueue()
    addAll()
    playNextTrack()
}

const addAll = () => {
    addTracks(detail.data)
}

const markScrollState = () => {
    markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    playlistDetailRef.value.scrollTop = markScrollTop
}

const bindScrollListener = () => {
    playlistDetailRef.value.removeEventListener('scroll', markScrollState)
    playlistDetailRef.value.addEventListener('scroll', markScrollState)
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

onActivated(() => restoreScrollState())

watch(() => props.id, () => {
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
})

onMounted(() => {
    resetBack2TopBtn()
    loadContent()
    bindScrollListener()
})
</script>

<template>
    <div id="playlist-detail" ref="playlistDetailRef">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right">
                <div class="title">{{ detail.title }}</div>
                <div class="about" v-html="detail.about">
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll"  :rightAction="addAll">
                    </PlayAddAllBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">歌曲({{ listSize }})</div>
            <SongListControl :data="detail.data" 
                :artistVisitable="true" 
                :albumVisitable="true" >
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#playlist-detail {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 28px 33px 10px 33px;
    overflow: auto;
}

#playlist-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#playlist-detail .header .right {
    flex: 1;
    margin-left: 20px;
}

#playlist-detail .header .title, 
#playlist-detail .header .about {
    text-align: left;
    margin-bottom: 13px;
}

#playlist-detail .header .title {
    font-size: 21px;
    font-weight: bold;
}

#playlist-detail .header .about {
    height: 119px;
    line-height: 20px;
    color: #bababa;
    overflow: hidden;
    word-wrap: break-all;
    white-space:pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
}

#playlist-detail .header .cover {
    width: 202px;
    height: 202px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#playlist-detail  .list-title {
    margin-bottom: 15px;
    text-align: left;
    font-size: 18px;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}
</style>