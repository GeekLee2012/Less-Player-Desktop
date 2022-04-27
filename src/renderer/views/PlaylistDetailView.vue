<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'PlaylistDetailView'
}
</script>

<script setup>
import { onBeforeMount, reactive, ref } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';

const { getVender } = usePlatformStore()
const { addTracks, resetQueue, playNextTrack } = usePlayStore()

const props = defineProps({
    platform: String,
    id: String
})

const detail = reactive({})
const listSize = ref(0)
let offset = 0
let page = 1
let limit = 1000

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

onBeforeMount(() => {
    loadContent()
})

const playAll = () => {
    resetQueue()
    addAll()
    playNextTrack()
}

const addAll = () => {
    addTracks(detail.data)
}
</script>

<template>
    <div id="playlist-detail">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right">
                <div class="title">{{ detail.title }}</div>
                <div class="about">
                    {{ detail.about }}
                </div>
                <div class="action">
                    <PlayAddAllBtn :playAction="playAll" 
                        :addAction="addAll">
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