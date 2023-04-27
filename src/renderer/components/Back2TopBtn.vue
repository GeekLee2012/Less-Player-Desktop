<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useSettingStore } from '../store/settingStore';
import { smoothScroll } from '../../common/Utils';


const props = defineProps({
    threshold: Number,
    //maxScrollTopThreshold: Number,
    target: Object
})

const { layout } = storeToRefs(useSettingStore())

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

const scrollToTop = () => {
    if (!scrollTarget) return
    //scrollTarget.scrollTop = 0
    smoothScroll(scrollTarget, 0, 520, 8)
}

defineExpose({
    setScrollTarget
})
</script>

<template>
    <div class="back2top-btn" :class="{ 'back2top-btn-autolayout': (layout.index == 1) }" @click="scrollToTop"
        v-show="isBtnShow">
        <svg width="14" height="14" viewBox="0 0 597.39 511.99" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                        d="M298.63,272.34a68.71,68.71,0,0,1-4.56,5.9Q184.34,388,74.54,497.79c-15.65,15.64-36.81,18.59-54.24,7.73A42.55,42.55,0,0,1,9.92,442c1.69-2.05,3.6-3.93,5.48-5.82l250.29-250.3c20.61-20.6,45.42-20.64,66-.08q124.8,124.78,249.64,249.55c8,8,14.17,16.69,15.62,28.23a42.59,42.59,0,0,1-69.19,38.62c-2.57-2.1-4.9-4.51-7.26-6.86Q411.94,386.85,303.42,278.3C302,276.89,300.91,275.19,298.63,272.34Z" />
                    <path
                        d="M299.26,0Q426,0,552.69,0c21.93,0,38.44,12.47,43.46,32.61,6.46,25.9-13.1,51.75-39.8,52.59-1.16,0-2.33,0-3.5,0q-254.19,0-508.37,0c-21.54,0-38.41-12.88-43.3-32.92C-5,26.79,14.06,1.27,40.32.11,44.15-.06,48,0,51.82,0Z" />
                </g>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.back2top-btn {
    position: fixed;
    bottom: 36px;
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

.back2top-btn:hover {
    background: var(--back2top-btn-bg);
}

.back2top-btn svg {
    fill: var(--back2top-btn-svg-color) !important;
}

.back2top-btn svg:hover {
    fill: var(--back2top-btn-svg-color) !important;
}

/*TODO */
.back2top-btn-autolayout {
    bottom: 100px;
    right: 20px;
}
</style>