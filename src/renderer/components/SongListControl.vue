<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, reactive, ref } from 'vue';
import EventBus from '../../common/EventBus';
import { useMainViewStore } from '../store/mainViewStore';
import SongItemContextMenu from './SongItemContextMenu.vue';

const props = defineProps({
    data: Array,
    artistVisitable: Boolean,
    albumVisitable: Boolean
})

const { songItemCtxMenuShow } = storeToRefs(useMainViewStore())
const { showSongItemCtxMenu, hideSongItemCtxMenu, hidePlaybackQueueView } = useMainViewStore()

const menuPos = reactive({ left: -999, top: -999})

const adjustPosition = (event) => {
  const { x, y, clientX, clientY } = event
  const pos = { x, y }
  const { clientWidth, clientHeight } = document.documentElement
  //TODO 菜单大小待改为自动获取
  const menuWidth = 179, menuHeight = 206.5, padding = 10 
  const gapX = clientX + menuWidth - clientWidth
  const gapY = clientY + menuHeight - clientHeight
  //右边界
  if(gapX > 0) {
    pos.x = pos.x - gapX - padding
  }
  //底部边界
  if(gapY > 0) {
    //pos.y = pos.y - gapY - padding
    pos.y = pos.y - menuHeight + padding
  }
  return pos
}

const setMenuPosition = (event) => {
  const pos = adjustPosition(event)
  menuPos.left = pos.x + "px !important"
  menuPos.top = pos.y + "px !important"
}

EventBus.on("songItem-showMenu", e => {
    hideSongItemCtxMenu()
    setMenuPosition(e.event)
    showSongItemCtxMenu(e.value)
    hidePlaybackQueueView()
})
</script>

<template>
    <div class="songlist-ctl">
        <div v-for="(item, index) in data">
            <SongItem :index="index" :data="item"
                :artistVisitable="artistVisitable"
                :albumVisitable="albumVisitable" >
            </SongItem>
        </div>
        <transition>
            <SongItemContextMenu v-show="songItemCtxMenuShow" :pos="menuPos">
            </SongItemContextMenu>
        </transition>
    </div>
</template>

<style scoped>
.songlist-ctl {
    display: flex;
    flex-direction: column;
}
</style>