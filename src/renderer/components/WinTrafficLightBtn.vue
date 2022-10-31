<script setup>
import { ref } from 'vue';
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from '../../common/Utils';
import { useAppCommonStore } from '../store/appCommonStore';
const { quit, minimize, maximize } = useAppCommonStore()
const isMinBtnDisabled = ref(false)

const setMinBtnDisabled = (value) => {
    isMinBtnDisabled.value = value
}

const doMinimize = () => {
    if(isMinBtnDisabled.value) return 
    minimize()
}

const ipcRenderer = useIpcRenderer()

if(ipcRenderer) {
    ipcRenderer.on('app-max', (event, ...args) => {
        setMinBtnDisabled(args[0])
    })
}
</script>

<template>
    <div class="win-traffic-light-btn">
        <div @click="quit" class="close-btn">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="cross"><line class="cls-1" x1="7" x2="25" y1="7" y2="25"/><line class="cls-1" x1="7" x2="25" y1="25" y2="7"/></g></svg>
        </div>
        <div @click="doMinimize" class="min-btn" :class="{ btnDisabled: isMinBtnDisabled }">
            <svg viewBox="0 0 256 256" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M208,134.4H48c-3.534,0-6.4-2.866-6.4-6.4s2.866-6.4,6.4-6.4h160c3.534,0,6.4,2.866,6.4,6.4S211.534,134.4,208,134.4z"/></svg>
        </div>
        <div @click="maximize" class="max-btn">
            <svg width="7" height="7" viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M2,18V2H18"/><path class="cls-1" d="M23,6V22H7"/></g></g></svg>
        </div>
    </div>
</template>

<style scoped>
.win-traffic-light-btn {
    display: flex;
    width: 56px;
    margin-top: 18px;
    margin-left: 15px;
}

.win-traffic-light-btn .btnDisabled {
    cursor: default !important;
}

.win-traffic-light-btn div {
    width: 12.5px;
    height: 12.5px;
    border-radius: 10rem;
    margin-right: 8px;
    -webkit-app-region: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.win-traffic-light-btn div:hover {
    cursor: pointer;
}

.win-traffic-light-btn .close-btn {
    background-color: #fc605c;
}

.win-traffic-light-btn svg {
    fill: #555;
    stroke-width: 3.6px;
    stroke: #555;
    padding: 1px;
    visibility: hidden;
}

.win-traffic-light-btn:hover svg {
    visibility: visible;
}

.win-traffic-light-btn .min-btn svg {
    stroke-width: 28px !important;
}

.win-traffic-light-btn .max-btn svg {
    stroke-width: 3px !important;
}


.win-traffic-light-btn .min-btn {
    background-color: #fdbc40;
}

.win-traffic-light-btn .max-btn {
    background-color: #34c648;
    margin-right: 0px !important;
}
</style>