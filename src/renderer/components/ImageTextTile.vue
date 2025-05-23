<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlatformStore } from '../../renderer/store/platformStore';
import { useSettingStore } from '../../renderer/store/settingStore';
import { coverDefault, isBlank, toTrimString, toHhMmss } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    cover: String,
    title: String,
    subtitle: String,
    playCount: String,
    extraText: String,
    color: String,
    playable: Boolean,
    playAction: Function,
    favorable: Boolean,
    //TODO 目前设计关注点，仅在提供便捷的收藏、关注功能；
    // 而其反向功能和状态显示（变更后），均不支持；因为需要耗费更多的时间、性能！
    favorAction: Function, 
    //标题点击事件处理
    titleAction: Function,
    checkbox: Boolean,
    checked: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    platform: String,
    videoStyle: Boolean,
    songStyle: Boolean,
    coverFit: Number,
    singleLineTitleStyle: Boolean,
    centerTitleStyle: Boolean,
    duration: Number,
    tutorial: Boolean,
})

const { isFreeFM, isFMRadioPlatform } = usePlatformStore()
const { isUseCardStyleImageTextTile, isUseShadowForCardStyleTile,
    isUseHCardStyleImageTextTile, isUseReversedForHCardStyleTile,
    isUseSmallIconForHCardStyleTile, isUseCoverNopaddingForHCardStyleTile,
    isUseCoverNoshadowForHCardStyleTile,
 } = storeToRefs(useSettingStore())


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

const notCardStyleFreeFM = computed(() => {
    return isFreeFM(props.platform) && !isUseCardStyleImageTextTile.value
})

const computedBigTitle = computed(() => {
    const { title } = props
    const _title = toTrimString(title)
    if(isBlank(_title)) return
    //此处为中文符号
    const delimiter = '｜'
    if(!_title.includes(delimiter)) return _title
    const parts = _title.split(delimiter)
    return parts && parts.length >= 1 && toTrimString(parts[1])
})

const onTitleClick = (event) => {
    const { titleAction } = props
    if(typeof titleAction == 'function') titleAction(event)
}


/* 生命周期、监听 */
watch(() => props.checked, (nv, ov) => {
    if (props.ignoreCheckAllEvent) return
    setChecked(nv)
})

const eventsRegistration = {
    'checkbox-refresh': () => setChecked(false),
}
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div class="image-text-tile" 
            :class="{
            'image-text-tile-card': isUseCardStyleImageTextTile,
            'image-text-tile-card-shadow': isUseShadowForCardStyleTile,
            'image-text-tile-radio': isFMRadioPlatform(platform),
            'image-text-tile-non-freefm': !isFreeFM(platform),
            'image-text-tile-color-mode': color,
            'image-text-tile-video': videoStyle,
            'image-text-tile-center-title-mode': centerTitleStyle,
            'image-text-tile-card-horiziontal': isUseHCardStyleImageTextTile,
            'horiziontal-reverse': isUseReversedForHCardStyleTile,
            'horiziontal-small-icon': isUseSmallIconForHCardStyleTile,
            'horiziontal-cover-nopadding': isUseCoverNopaddingForHCardStyleTile,
            'horiziontal-cover-noshadow': isUseCoverNoshadowForHCardStyleTile,
            'selectable': checkbox,
            'tutorial': tutorial,
        }" 
        @click.stop="toggleCheck">
        <div class="cover-wrap">
            <img class="cover" v-lazy="coverDefault(cover)" v-show="!color"
                :class="{ 'obj-fit-contain': (coverFit == 1) }" />
            <div class="cover" v-show="color" :style="{ background: color }">
                <div class="big-title" v-html="computedBigTitle"></div>
            </div>
            <div class="cover-mask">
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
                    <svg v-show="isChecked" class="checked-svg" width="25" height="25" viewBox="0 0 767.89 767.94"
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
            <div class="cover-bottom" v-show="!checkbox && (videoStyle || songStyle || playCount)">
                <div class="duration" v-show="duration" v-html="toHhMmss(duration)">
                </div>
                <div class="play-count" v-show="playCount && !duration" v-html="playCount">
                </div>
            </div>
        </div>
        <!-- 目前体验不好
            <picture>
                <source type="image/webp" :srcset="cover">
                <img class="cover" v-lazy="cover" /> 
            </picture>
            -->
        <div class="title-wrap">
            <div class="title" 
                :class="{ 'singleline-title': singleLineTitleStyle }" 
                @click="onTitleClick"
                v-html="title">
            </div>
            <div class="subtitle" @click="onTitleClick" v-show="subtitle" v-html="subtitle">
            </div>
            <div class="extra-text" @click="onTitleClick" v-show="extraText" v-html="extraText">
            </div>
            <div class="action">
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
                    <svg v-show="isChecked" class="checked-svg" width="25" height="25" viewBox="0 0 767.89 767.94"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="play-btn" v-show="playable && !checkbox" @click.stop="playAction">
                    <svg width="17" height="17" viewBox="0 0 139 139" xml:space="preserve"
                        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                            d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                    </svg>
                </div>
                <div class="favorite-btn" v-show="favorable && !checkbox" @click.stop="favorAction">
                    <svg v-show="true" width="17" height="17" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="false" width="17" height="17" viewBox="0 0 1024 937.53" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
        <div class="layer"></div>
        <div class="layer layer-tiny"></div>
    </div>
</template>

<style scoped>
.image-text-tile {
    /*margin: 15px 13px;*/
    margin: 15px 13px 11px 13px;
    position: relative;
    --card-shadow-height: 6px;
}

.image-text-tile .cover {
    width: var(--others-image-text-tile-cover-size);
    height: var(--others-image-text-tile-cover-size);
    line-height: var(--others-image-text-tile-cover-size);
    border-radius: var(--border-img-text-tile-border-radius);
    cursor: pointer;
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);
    box-shadow: 0px 0px 3px #181818;
    background-color: var(--app-bg-color);
}

.image-text-tile .title {
    width: var(--others-image-text-tile-cover-size);
    margin-top: 6px;
    text-align: left;
    cursor: pointer;
    line-height: var(--content-text-line-height);

    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    line-break: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    color: var(--content-text-color);
    /*font-size: calc(var(--content-text-size) - 0.5px);*/
}

.image-text-tile .singleline-title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    line-break: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 1 !important;
    line-clamp: 1 !important;
    -webkit-box-orient: vertical;
}

.image-text-tile .title:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

/*强制换行、截断英文单词，虽然不好看，但尽量避免文字超长，撑开并挤掉其他UI元素*/
.image-text-tile .subtitle,
.image-text-tile .extra-text {
    width: var(--others-image-text-tile-cover-size);
    text-align: left;
    line-height: 25px;
    color: var(--content-secondary-text-color);
    font-size: var(--content-text-tip-text-size);
    color: var(--content-subtitle-text-color);

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    word-wrap: break-word;
    line-break: anywhere;
    cursor: pointer;
}

.image-text-tile svg {
    fill: var(--button-icon-btn-color);
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
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    visibility: hidden;
    cursor: pointer;
}

.image-text-tile .cover-wrap:hover .cover-mask,
.image-text-tile.selectable .cover-wrap .cover-mask {
    visibility: visible;
}

.image-text-tile .cover-wrap .cover-mask .checkbox {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 25px;
    height: 25px;
    background: var(--app-bg-color);
    border-radius: 5px;
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
}

.image-text-tile .cover-wrap .checkbox svg {
    fill: var(--content-highlight-color);
}

.image-text-tile .cover-wrap .play-btn {
    border-radius: 10rem;
    --btn-size: 49px;
    width: var(--btn-size);
    height: var(--btn-size);
    position: absolute;
    right: 10px;
    bottom: 10px;
    right: calc((100% - var(--btn-size))/ 2);
    bottom: calc((100% - var(--btn-size))/2);
    z-index: 1;
    background: var(--button-icon-text-btn-bg-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 3px 10px #00000088;
}

.image-text-tile .cover-wrap .cover-bottom .duration,
.image-text-tile .cover-wrap .cover-bottom .play-count {
    position: absolute;
    bottom: 0px;
    right: 0px;
    z-index: 1;
    color: #fff;
    font-weight: bold;
    padding: 5px 9px;
    font-size: calc(var(--content-text-tip-text-size) - 1px);
    background-color: #16161633;
}

.image-text-tile .cover-wrap .cover-bottom .play-count {
    color: #f9f9f9;
    background: transparent;
}

.image-text-tile .cover-wrap .play-btn:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
    transform: scale(1.05);
}

.image-text-tile .cover-wrap .play-btn svg {
    margin-top: 1px;
    margin-left: 2px;
    fill: var(--button-icon-text-btn-icon-color) !important;
}

.image-text-tile .cover-wrap .big-title {
    display: none;
}

/* 实验性CSS - Card */
.image-text-tile-card {
    background-color: var(--app-bg-color);
    /*box-shadow: 0px 0px 3px var(--border-popovers-border-color);*/
    box-shadow: 0px 0px 3px #181818;
    border-radius: var(--border-img-text-tile-border-radius);
    min-height: var(--others-image-text-tile-card-min-height);
    margin-top: 18px;
    margin-bottom: 15px;
}

.image-text-tile-card:hover {
    transform: scale(1.08) translateY(-4px);
}

.image-text-tile-card:hover .title {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.image-text-tile-card .cover-wrap:hover {
    transform: none;
}

.image-text-tile-card .cover {
    box-shadow: none;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    /*height: var(--others-image-text-tile-card-cover-height);*/
    height: calc(var(--others-image-text-tile-card-cover-height) + 5px);
}

.image-text-tile-card .cover-wrap {
    border-bottom: 1px solid var(--border-color);
}

.image-text-tile-card .title-wrap {
    /*padding: 8px 15px 10px 15px;*/
    padding: 4px 15px 9px 15px;
    /*width: var(--others-card-image-text-tile-title-width);*/
    width: calc(var(--others-image-text-tile-cover-size) - 30px);
}

.image-text-tile-card .radio-title-wrap {
    background-color: var(--content-left-nav-bg-color);
}

.image-text-tile-card .title {
    margin-top: 0px;
}

.image-text-tile-card .title,
.image-text-tile-card .subtitle {
    width: auto;
}

/*.image-text-tile-card .title,
.image-text-tile-card .subtitle,*/
.image-text-tile-card.image-text-tile-radio .title,
.image-text-tile-card.image-text-tile-radio .subtitle,
.image-text-tile-card.image-text-tile-radio .extra-text,
.image-text-tile-card.image-text-tile-color-mode .title,
.image-text-tile-card.image-text-tile-color-mode .subtitle,
.image-text-tile-card.image-text-tile-color-mode .extra-text,
.image-text-tile-card.image-text-tile-center-title-mode .title,
.image-text-tile-card.image-text-tile-center-title-mode .subtitle,
.image-text-tile-card.image-text-tile-center-title-mode .extra-text {
    text-align: center;
}

.image-text-tile-card.image-text-tile-radio.image-text-tile-non-freefm:hover .cover-mask {
    visibility: visible;
}

.image-text-tile-color-mode .title {
    line-break: normal;
}

.image-text-tile.image-text-tile-color-mode .cover {
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-text-tile.image-text-tile-color-mode .cover-wrap .big-title {
    display: flex;
    line-height: calc(var(--content-text-module-subtitle-size) + 4px);
    font-size: var(--content-text-module-subtitle-size);
    color: #ffffff;
    font-weight: bold;
    align-items: center;
    justify-content: center;
    padding: 8px;
    word-wrap: break-word;
}


.image-text-tile-video {
    margin: 18px 15px;
}

.image-text-tile-video .cover,
.image-text-tile-video .title-wrap,
.image-text-tile-video .title,
.image-text-tile-video .subtitle,
.image-text-tile-video .extra-text {
    width: calc(var(--others-image-text-tile-cover-size) * 1.36);
}

.image-text-tile-video .cover {
    height: calc(var(--others-image-text-tile-cover-size * 0.85));
}


.image-text-tile-card.image-text-tile-video .title-wrap {
    /* padding: 10px 21px 16px 21px; */
    /* width: calc(var(--others-image-text-tile-cover-size) * 1.36 - 42px); */
    padding: 5px 15px 13px 15px;
    width: calc(var(--others-image-text-tile-cover-size) * 1.36 - 30px);
}

.image-text-tile-card.image-text-tile-video .title,
.image-text-tile-card.image-text-tile-video .subtitle {
    width: auto !important;
}

.image-text-tile img[lazy=loading].obj-fit-contain,
.image-text-tile img[lazy=error].obj-fit-contain {
    object-fit: cover !important;
}

.image-text-tile .layer,
.image-text-tile .layer-tiny {
    display: none;
}

.image-text-tile-card.image-text-tile-card-shadow .layer,
.image-text-tile-card-horiziontal.image-text-tile-card-shadow .layer {
    display: block;
    z-index: -2;
    width: 90%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 50%;
    transform: translate(-50%, var(--card-shadow-height));
    border-radius: var(--border-img-text-tile-border-radius);
    background: var(--content-regular-bg-color);
}

.image-text-tile-card.image-text-tile-card-shadow .layer-tiny,
.image-text-tile-card-horiziontal.image-text-tile-card-shadow .layer-tiny  {
    z-index: -3;
    width: 80%;
    transform: translate(-50%, calc(var(--card-shadow-height) * 2));
    background: var(--content-light-bg-color);
}

.image-text-tile-card:hover .layer,
.image-text-tile-card:hover .layer-tiny,
.image-text-tile-card-horiziontal:hover .layer,
.image-text-tile-card-horiziontal:hover .layer-tiny {
    background: transparent;
    display: none;
}

.default-old-layout .image-text-tile-card {
    margin-bottom: 25px;
}

/* 实验性CSS - Horiziontal Card */
.image-text-tile-card-horiziontal {
    --others-image-text-tile-cover-size: 168px;
    --hpadding: 30px;
    display: flex;
    flex-direction: row;
    width: calc(var(--others-image-text-tile-cover-size) * var(--others-image-text-tile-hcard-width-ratio) - var(--hpadding));
    border-radius: var(--border-img-text-tile-border-radius);
    padding: 20px 10px 20px 20px;
    /*background: var(--app-bg-color);
    background: var(--content-left-nav-bg-color);
    background: var(--content-loading-mask-color);*/
    background: var(--content-list-item-hover-bg-color);

    margin-top: 18px !important;
    margin-bottom: 12px !important;
    cursor: pointer;
    /*box-shadow: 0px 0px 3px #181818;*/
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);
}

.image-text-tile-card-horiziontal:hover {
    transform: translateY(-8px);
}

.image-text-tile-card-horiziontal .cover-wrap .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.66);
    height: calc(var(--others-image-text-tile-cover-size) * 0.66);
}

.image-text-tile-card-horiziontal .cover-wrap .cover-mask,
.image-text-tile-card-horiziontal .cover-wrap:hover .cover-mask {
    visibility: hidden !important;
}

.image-text-tile-card-horiziontal .title-wrap {
    flex: 1;
    padding-left: 10px;
    padding-right: 10px;
    position: relative;
}

.image-text-tile-card-horiziontal .title-wrap .title,
.image-text-tile-card-horiziontal .title-wrap .subtitle,
.image-text-tile-card-horiziontal .title-wrap .extra-text {
    width: 100% !important;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1 !important;
    line-clamp: 1 !important;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    margin-top: 0px;
}

.image-text-tile-card-horiziontal .title-wrap .title {
    -webkit-line-clamp: 2 !important;
    line-clamp: 2 !important;
    /*font-size: calc(var(--content-text-size) + 1px);*/
}

.image-text-tile-card-horiziontal .title-wrap .title.singleline-title {
    -webkit-line-clamp: 1 !important;
    line-clamp: 1 !important;
}

.image-text-tile-card-horiziontal.image-text-tile-color-mode .cover-wrap .big-title {
    font-size: calc(var(--content-text-module-subtitle-size) - 5px);
}

.image-text-tile-card-horiziontal.image-text-tile-color-mode.tutorial .cover-wrap .big-title {
    display: none;
}

.image-text-tile-card-horiziontal.tutorial .title-wrap .title {
    -webkit-line-clamp: 4 !important;
    line-clamp: 4 !important;
}

.image-text-tile .title-wrap .action {
    display: none;
}

.image-text-tile-card-horiziontal .title-wrap .action {
    position: absolute;
    right: 13px;
    bottom: 0px;
    display: flex;
    align-items: center;
    padding: 0px !important;
}

.image-text-tile-card-horiziontal .title-wrap .action .play-btn,
.image-text-tile-card-horiziontal .title-wrap .action .favorite-btn {
    z-index: 1;
    border-radius: 10rem;
    --btn-size: 36px;
    width: var(--btn-size);
    height: var(--btn-size);
    background: var(--button-icon-text-btn-bg-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-left: 20px;
    /*box-shadow: 0px 3px 10px #00000088;*/
}

.image-text-tile-card-horiziontal .title-wrap .action .play-btn:hover,
.image-text-tile-card-horiziontal .title-wrap .action .favorite-btn:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
    transform: scale(1.08);
}

.image-text-tile-card-horiziontal .title-wrap .action .play-btn svg {
    margin-top: 1px;
    margin-left: 2px;
    fill: var(--button-icon-text-btn-icon-color) !important;
}

.image-text-tile-card-horiziontal .title-wrap .action .favorite-btn svg {
    margin-top: 2px;
    fill: var(--button-icon-text-btn-icon-color) !important;
}


/* Horiziontal Card - Reversed */
.image-text-tile-card-horiziontal.horiziontal-reverse {
    flex-flow: row-reverse;
    padding: 20px 20px 20px 10px;
}

.image-text-tile-card-horiziontal.horiziontal-reverse .title-wrap .action {
    left: 10px;
}

.image-text-tile-card-horiziontal.horiziontal-reverse .title-wrap .action .play-btn,
.image-text-tile-card-horiziontal.horiziontal-reverse .title-wrap .action .favorite-btn {
    margin-left: 0px;
    margin-right: 20px;
}


/* Horiziontal Card - Simple Icon */
.image-text-tile-card-horiziontal.horiziontal-small-icon .title-wrap .action {
    bottom: 3px;
}

.image-text-tile-card-horiziontal.horiziontal-small-icon .title-wrap .action .play-btn,
.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .favorite-btn {
    margin-left: 25px;
    --btn-size: auto !important;
    border-radius: 0px !important;
    background: transparent !important;
}

.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .play-btn svg,
.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .favorite-btn svg {
    margin-top: 0px;
    margin-left: 0px;
    transform: scale(1.08);
    fill: var(--button-icon-btn-color) !important;
}

.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .play-btn:hover,
.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .favorite-btn:hover {
    background: transparent !important;
}

.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .play-btn:hover svg,
.image-text-tile-card-horiziontal.horiziontal-small-icon  .title-wrap .action .favorite-btn:hover svg {
    transform: scale(1.2);
    fill: var(--content-highlight-color) !important;
}

.image-text-tile-card-horiziontal.horiziontal-small-icon.horiziontal-reverse .title-wrap .action .play-btn,
.image-text-tile-card-horiziontal.horiziontal-small-icon.horiziontal-reverse .title-wrap .action .favorite-btn {
    margin-left: 0px;
    margin-right: 25px;
}

/* Horiziontal Card - Video  */
.image-text-tile-card-horiziontal.image-text-tile-video {
    --others-image-text-tile-cover-size: 168px !important;
    margin-top: 18px !important;
    margin-bottom: 12px !important;
    margin-left: 13px !important;
    margin-right: 13px !important;
}

.image-text-tile-card-horiziontal.image-text-tile-video .title-wrap,
.image-text-tile-card-horiziontal.image-text-tile-video .title,
.image-text-tile-card-horiziontal.image-text-tile-video .subtitle,
.image-text-tile-card-horiziontal.image-text-tile-video .extra-text {
    width: 100% !important;
}

.image-text-tile-card-horiziontal.image-text-tile-video .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.88) !important;
    height: calc(var(--others-image-text-tile-cover-size) * 0.66) !important;
}


/* Mini NavBar Mode */
.mini-navbar-mode .image-text-tile {
    margin-top: 23px;
    margin-bottom: 20px;
}

.mini-navbar-mode .image-text-tile-card {
    margin-top: 25px;
    margin-bottom: 20px;
}

.mini-navbar-mode .image-text-tile-video {
    margin: 18px 15px;
}

.mini-navbar-mode .image-text-tile-video .cover,
.mini-navbar-mode .image-text-tile-video .title-wrap,
.mini-navbar-mode .image-text-tile-video .title,
.mini-navbar-mode .image-text-tile-video .subtitle,
.mini-navbar-mode .image-text-tile-video .extra-text {
    width: calc(var(--others-image-text-tile-cover-size) * 1.25);
}

.mini-navbar-mode .image-text-tile-video .cover {
    height: calc(var(--others-image-text-tile-cover-size * 0.85));
}


.mini-navbar-mode .image-text-tile-card.image-text-tile-video .title-wrap {
    width: calc(var(--others-image-text-tile-cover-size) * 1.25 - 30px);
}

/* Horiziontal Card - Video  */
.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video {
    --others-image-text-tile-cover-size: 168px !important;
    margin-top: 18px !important;
    margin-bottom: 12px !important;
    margin-left: 13px !important;
    margin-right: 13px !important;
}

.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video .title-wrap,
.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video .title,
.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video .subtitle,
.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video .extra-text {
    width: 100% !important;
}

.mini-navbar-mode .image-text-tile-card-horiziontal.image-text-tile-video .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.88) !important;
    height: calc(var(--others-image-text-tile-cover-size) * 0.66) !important;
}


/* Horiziontal Card - Full Cover  */
.image-text-tile-card-horiziontal.horiziontal-cover-nopadding {
    padding: 0px;
    margin-bottom: 13px !important;
    --hpadding: 0px !important;
}

.image-text-tile-card-horiziontal.horiziontal-cover-nopadding .cover-wrap .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.66 + 15px);
    height: calc(var(--others-image-text-tile-cover-size) * 0.66 + 28px);
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
}

.image-text-tile-card-horiziontal.horiziontal-cover-nopadding .title-wrap {
    padding: 15px 15px 15px 15px;
}

.image-text-tile-card-horiziontal.horiziontal-cover-nopadding .title-wrap .action {
    right: 18px;
    bottom: 15px;
}

.image-text-tile-card-horiziontal.horiziontal-cover-nopadding.horiziontal-reverse  .cover-wrap .cover {
    border-top-right-radius: var(--border-img-text-tile-border-radius);
    border-bottom-right-radius: var(--border-img-text-tile-border-radius);
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
}

.image-text-tile-card-horiziontal.horiziontal-cover-nopadding.horiziontal-reverse .title-wrap .action {
    left: 15px;
}

/* Horiziontal Card - Full Cover - Video  */
.image-text-tile-card-horiziontal.image-text-tile-video.horiziontal-cover-nopadding .cover-wrap .cover {
    height: calc(var(--others-image-text-tile-cover-size) * 0.66 + 28px) !important;
}

/* Horiziontal Card - Cover No Shadow  */
.image-text-tile-card-horiziontal.horiziontal-cover-noshadow .cover-wrap .cover {
    box-shadow: none !important;
}
</style>