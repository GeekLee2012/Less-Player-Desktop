<script setup>
import { ref, watch, onMounted } from 'vue';
import EventBus from '../../common/EventBus';



const props = defineProps({
    cover: String,
    title: String,
    subtitle: String,
    playable: Boolean,
    playAction: Function,
    checkbox: Boolean,
    checked: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function
})

const isChecked = ref(props.checked)
const toggleCheck = () => {
    const { checkbox, checkChangedFn } = props
    if (!checkbox) return
    setChecked(!isChecked.value)
    if (checkChangedFn) checkChangedFn(isChecked.value)
}

const setChecked = (value) => {
    isChecked.value = value
}

/*
onMounted(() => {
    EventBus.emit("imageTextTiles-mounted")
})
*/

watch(() => props.checked, (nv, ov) => {
    if (props.ignoreCheckAllEvent) return
    setChecked(nv)
})

EventBus.on("checkbox-refresh", () => setChecked(false))
</script>

<template>
    <div class="image-text-tile" @click="toggleCheck">
        <div class="cover-wrap">
            <img class="cover" v-lazy="cover" />
            <div class="cover-mask" :class="{ selectable: checkbox }">
                <div class="play-btn" v-show="playable && !checkbox" @click.stop="playAction">
                    <svg width="21" height="21" viewBox="0 0 139 139" xml:space="preserve"
                        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                            d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                    </svg>
                </div>
                <div class="checkbox" v-show="checkbox">
                    <svg v-show="!isChecked" width="25" height="25" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="isChecked" width="25" height="25" viewBox="0 0 767.89 767.94"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
        <!-- 目前体验不好
            <picture>
                <source type="image/webp" :srcset="cover">
                <img class="cover" v-lazy="cover" /> 
            </picture>
            -->
        <div class="title" v-html="title"></div>
        <div class="subtitle" v-show="subtitle" v-html="subtitle"></div>
    </div>
</template>

<style scoped>
.image-text-tile {
    margin: 15px 13px;
}

.image-text-tile .cover {
    width: var(--image-text-tile-cover-size);
    height: var(--image-text-tile-cover-size);
    line-height: var(--image-text-tile-cover-size);
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0px 0px 3px #161616;
    background-color: var(--text-color);
}

.image-text-tile .cover-wrap:hover {
    transform: scale(1.05) translateY(-4px);
}

.image-text-tile .title {
    width: var(--image-text-tile-cover-size);
    margin-top: 12px;
    text-align: left;
    cursor: pointer;
    line-height: var(--text-line-height);

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.image-text-tile .title:hover {
    background: var(--btn-bg);
    -webkit-background-clip: text;
    color: transparent;
}

.image-text-tile .subtitle {
    width: var(--image-text-tile-cover-size);
    text-align: left;
    line-height: 25px;
    color: #989898;
    font-size: 13px;
    font-weight: 520;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.image-text-tile svg {
    fill: var(--svg-color);
    cursor: pointer;
    -webkit-app-region: no-drag;
}

.image-text-tile .cover-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.image-text-tile .cover-wrap .cover-mask {
    position: absolute;
    margin: auto;
    z-index: 2;
    visibility: hidden;
}

.image-text-tile .cover-wrap:hover .cover-mask {
    visibility: visible;
}

.image-text-tile .cover-wrap .selectable {
    visibility: visible;
    top: 10px;
    left: 10px;
    width: 25px;
    height: 25px;
    background: var(--checkbox-bg);
    border-radius: 6px;
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
}

.image-text-tile .cover-mask .checkbox {}

.image-text-tile .checkbox svg {
    fill: var(--hl-color);
}

.image-text-tile .cover-wrap .play-btn {
    border-radius: 10rem;
    width: 43px;
    height: 43px;
    background: var(--btn-bg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
}

.image-text-tile .cover-wrap .play-btn:hover {
    background: var(--btn-hover-bg);
}

.image-text-tile .cover-wrap .play-btn svg {
    margin-top: 1px;
    margin-left: 2px;
    fill: var(--svg-btn-color) !important;
}
</style>