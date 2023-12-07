<script setup>
import { ref, watch, inject, computed } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { ActivateState } from '../../common/Constants';



const props = defineProps({
    index: Number,
    data: Object, //Track
    deleteFn: Function,
    dataType: Number,
    checkbox: Boolean,
    checked: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
})

const { showContextMenu, visitLink } = inject('appCommon')


const isChecked = ref(props.checked)
const toggleCheck = () => {
    const { checkbox, checkChangedFn, checked } = props
    if (!checkbox) return
    setChecked(!isChecked.value)
    if (checkChangedFn) checkChangedFn(isChecked.value, { index: props.index, ...props.data })
}

const setChecked = (value) => isChecked.value = value


const onContextMenu = (event) => {
    if (props.checkbox) return

}

const computedStateText = computed(() => {
    const { data } = props
    if (!data) return
    const { state } = data
    if (!state) return
    if (state == ActivateState.ACTIVATED) return 'ON'
    else if (state == ActivateState.INVALID) return 'ERROR'
})

watch(() => props.checked, (nv, ov) => {
    if (props.ignoreCheckAllEvent) return
    setChecked(nv)
})

EventBus.on("plugin-checkbox-refresh", () => setChecked(false))
</script>

<template>
    <div class="plugin-item" @click="toggleCheck" @contextmenu="onContextMenu">
        <div v-show="checkbox" class="checkbox">
            <svg v-show="!isChecked" width="16" height="16" viewBox="0 0 731.64 731.66" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                    </g>
                </g>
            </svg>
            <svg v-show="isChecked" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div v-show="!checkbox" class="sqno">{{ index + 1 }}</div>
        <div class="stateflag textflag" v-show="data.state" :class="{ warning: (data.state == ActivateState.INVALID) }">
            <span v-html="computedStateText"></span>
        </div>
        <div class="repository" v-show="data.repository" @click.stop="visitLink(data.repository)"
            :class="{ spacing1: (data.state) }">
            <svg width="16" height="16" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Capa_1" data-name="Capa 1">
                        <path
                            d="M29.3,63.47l-4.05,4a9.05,9.05,0,0,1-12.72,0,8.8,8.8,0,0,1,0-12.51l14.9-14.79c3.08-3.06,8.89-7.57,13.13-3.37a5,5,0,1,0,7-7c-7.19-7.14-17.83-5.82-27.1,3.37L5.54,47.94a18.72,18.72,0,0,0,0,26.59,19,19,0,0,0,26.7,0l4-4a5,5,0,1,0-7-7ZM74.45,6C66.72-1.63,55.92-2,48.76,5.06l-5,5a5,5,0,0,0,7,7l5-5c3.71-3.69,8.57-2.16,11.73,1a8.79,8.79,0,0,1,0,12.52L51.58,41.37c-7.27,7.21-10.68,3.83-12.14,2.38a5,5,0,0,0-7,7,15.61,15.61,0,0,0,11.14,5c4.89,0,10-2.46,15-7.34l15.9-15.77A18.71,18.71,0,0,0,74.45,6Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div class="title-wrap" :class="{ spacing1: (data.state || data.repository) }">
            <span v-html="data.name"></span>
        </div>
        <div class="author spacing">
            <span v-html="data.author"></span>
        </div>
        <div class="version spacing">
            <span v-html="data.version"></span>
        </div>
        <div class="about spacing">
            <span v-html="data.about"></span>
        </div>
    </div>
</template>

<style scoped>
.plugin-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-bottom: 3px;
    border-radius: 3px;
}

.plugin-item:hover {
    /*border-radius: 3px;*/
    background: var(--content-list-item-hover-bg-color);
}

.plugin-item .hidden {
    display: none !important;
}

.plugin-item>div {
    line-height: 59px;
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

.plugin-item .spacing {
    margin-left: 10px !important;
}

.plugin-item .spacing1 {
    margin-left: 3px !important;
}

.plugin-item .title-wrap,
.plugin-item .version,
.plugin-item .author,
.plugin-item .about {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

.plugin-item .sqno,
.plugin-item .checkbox {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.plugin-item .checkbox {
    width: 30px;
}

.plugin-item .checkbox svg {
    margin-bottom: -3px;
}

.plugin-item .title-wrap {
    position: relative;
    text-align: left;
    margin-top: 1px;
    flex: 1;
}

.plugin-item .title-wrap span {
    word-wrap: break-word;
    line-break: anywhere;
}

.plugin-item .repository {
    width: 25px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 2px;
    margin-left: 1px;
}

.plugin-item .version {
    width: 88px;
    text-align: center;
}

.plugin-item .author {
    width: 15%;
    text-align: center;
}

.plugin-item .about {
    width: 30%;
}

.plugin-item .textflag span {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;

    border-radius: 3px;
    border: 1.3px solid var(--content-highlight-color);
    padding: 1px 3px;
    font-size: 12px;
    font-weight: bold;
}

.plugin-item .textflag.warning span {
    background: #fc605c;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    border-color: #fc605c;
}
</style>