<script setup>
import { ref, watch } from 'vue';
import EventBus from '../../common/EventBus';
import SliderBar from './SliderBar.vue';
import { usePlayStore } from '../store/playStore';
import { storeToRefs } from 'pinia';


//TODO 暂时先这样吧，早期写得比较乱
const status = ref(1)
const sliderRef = ref(null)
const { updateVolume } = usePlayStore()
const { volume } = storeToRefs(usePlayStore())

const setVolume = (value) => {
    updateUI(value)
    updateVolume(value)
}

//仅更新UI
const updateUI = (value) => {
    status.value = value > 0.5 ? 2 : (value > 0 ? 1 : 0)
    sliderRef.value.updateProgress(value)
}

const toggleMute = () => {
    updateVolume(sliderRef.value.toggleProgress())
}

watch(volume, (nv, ov) => updateUI(nv))

defineExpose({
    setVolume
})
</script>

<template>
    <div class="volume-bar">
        <div class="volume-status" @click="toggleMute">
            <svg v-show="status == 0" class="st-slient" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path
                        d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L5.89 16zm14.525-4l3.536 3.536-1.414 1.414L19 13.414l-3.536 3.536-1.414-1.414L17.586 12 14.05 8.464l1.414-1.414L19 10.586l3.536-3.536 1.414 1.414L20.414 12z" />
                </g>
            </svg>
            <svg v-show="status == 1" class="st-small" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path
                        d="M8.889 16H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L8.89 16zm9.974.591l-1.422-1.422A3.993 3.993 0 0 0 19 12c0-1.43-.75-2.685-1.88-3.392l1.439-1.439A5.991 5.991 0 0 1 21 12c0 1.842-.83 3.49-2.137 4.591z" />
                </g>
            </svg>
            <svg v-show="status == 2" class="st-large" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path
                        d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L5.89 16zm13.517 4.134l-1.416-1.416A8.978 8.978 0 0 0 21 12a8.982 8.982 0 0 0-3.304-6.968l1.42-1.42A10.976 10.976 0 0 1 23 12c0 3.223-1.386 6.122-3.594 8.134zm-3.543-3.543l-1.422-1.422A3.993 3.993 0 0 0 16 12c0-1.43-.75-2.685-1.88-3.392l1.439-1.439A5.991 5.991 0 0 1 18 12c0 1.842-.83 3.49-2.137 4.591z" />
                </g>
            </svg>
        </div>
        <SliderBar class="volume-value" ref="sliderRef" :initValue="0.5" :onseek="updateVolume" :onscroll="updateVolume"
            :ondrag="updateVolume">
        </SliderBar>
    </div>
</template>

<style>
.volume-bar {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    -webkit-app-region: none;
}

/* 
.volume-bar .volume-status,
.volume-bar .volume-value {
    margin: auto; 
}
*/

.volume-bar .volume-status {
    margin-top: 3px;
    width: 20px;
    cursor: pointer;
}

.volume-bar .volume-status svg {
    fill: var(--svg-color);
}

.volume-bar .st-slient,
.volume-bar .st-small,
.volume-bar .st-large {
    width: 20px;
    height: 20px;
}

.volume-bar .volume-status:hover svg {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
}

.volume-bar .volume-value {
    margin-left: 5px;
    width: 80px;
    height: 3px;
    border-radius: 10rem;
}

.volume-bar .volume-value .thumb {
    visibility: hidden;
}

.volume-bar:hover .volume-value .thumb {
    visibility: visible;
}
</style>