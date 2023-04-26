<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useSettingStore } from '../store/settingStore';
import EventBus from '../../common/EventBus';


const props = defineProps({
    threshold: Number,
    //maxScrollTopThreshold: Number,
    target: Object
})

const { layout, isPlaylistCategoryBarFlowBtnShow } = storeToRefs(useSettingStore())

let threshold = (props.threshold || 1024 * 2.33)
let scrollTarget = props.target
const isBtnShow = ref(false)
const maxScrollTopThreshold = 1024 * 5.20

const setBtnShow = (value) => {
    isBtnShow.value = value
}

const setScrollTarget = (target) => {
    scrollTarget = target
    setBtnShow(false)
    bindScrollListener()
}

const showAsNeeded = () => {
    const scrollTop = scrollTarget.scrollTop
    const scrollHeight = scrollTarget.scrollHeight
    const clientHeight = scrollTarget.clientHeight
    const maxScrollTop = scrollHeight - clientHeight

    if (maxScrollTop < maxScrollTopThreshold) return
    setBtnShow(scrollTop >= threshold)
}

const bindScrollListener = () => {
    if (!scrollTarget) return
    scrollTarget.removeEventListener('scroll', showAsNeeded)
    scrollTarget.addEventListener('scroll', showAsNeeded)
}

const toggleCategory = () => EventBus.emit('playlistCategory-toggle')

defineExpose({
    setScrollTarget
})
</script>

<template>
    <div class="playlist-categroy-flow-btn" :class="{ 'playlist-categroy-flow-btn-autolayout': (layout.index == 1) }"
        @click.stop="toggleCategory" v-show="isPlaylistCategoryBarFlowBtnShow && isBtnShow">
        <svg width="15" height="15" viewBox="0 0 29.3 29.3">
            <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                        d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                </g>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.playlist-categroy-flow-btn {
    position: fixed;
    bottom: 75px;
    right: 15px;
    z-index: 66;

    border: 0.1px solid var(--border-color);
    box-shadow: 0px 0px 1px #161616;
    background: var(--btn-bg);
    border-radius: 6px;
    width: 36px;
    height: 36px;

    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.playlist-categroy-flow-btn:hover {
    background: var(--back2top-btn-bg);
}

.playlist-categroy-flow-btn svg {
    fill: var(--back2top-btn-svg-color) !important;
}

.playlist-categroy-flow-btn svg:hover {
    fill: var(--back2top-btn-svg-color) !important;
}

/*TODO */
.playlist-categroy-flow-btn-autolayout {
    bottom: 139px;
    right: 20px;
}
</style>