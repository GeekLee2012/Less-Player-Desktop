<script setup>
import { nextTick, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { tryCallDefault } from '../../common/Utils';



const props = defineProps({
    checked: Boolean,
    onKeywordChanged: Function,
    interruptDeactivatedAction: Function,
})

const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value

const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { setSearchBarExclusiveAction } = useAppCommonStore()


const toggleAction = () => {
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

const onDeactivatedAction = () => {
    const { interruptDeactivatedAction } = props
    if (tryCallDefault(interruptDeactivatedAction, null, false)) return
    setSearchBarExclusiveAction(null)
    setSearchKeyword(null)
}

watch(searchKeyword, props.onKeywordChanged)
watch(() => props.checked, (nv) => {
    if (nv) nextTick(() => { setSearchBarExclusiveAction(setSearchKeyword) })
}, { immediate: true })
onUnmounted(onDeactivatedAction)
onDeactivated(onDeactivatedAction)
</script>

<template>
    <div class="searchbar-exclusive-mode-ctl checkbox text-btn" @click="toggleAction">
        <svg v-show="!searchBarExclusiveAction" width="16" height="16" viewBox="0 0 731.64 731.66"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                        d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                </g>
            </g>
        </svg>
        <svg v-show="searchBarExclusiveAction" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                        d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                </g>
            </g>
        </svg>
        <span>独占搜索框模式</span>
    </div>
</template>

<style scoped>
.searchbar-exclusive-mode-ctl {
    display: flex;
    align-items: center;
}
</style>