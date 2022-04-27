<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router';
import { usePlatformStore } from '../store/platformStore';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';

//是否为macOS
const isMacOS = electronApi.isMacOS
const router = useRouter()

const { platforms, currentPlatformIndex, currentPlatformCode, isLocal } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform } = usePlatformStore()

const updateNavIndex = (index) => {
    updateCurrentPlatform(index)
    const code = currentPlatformCode.value
    const url = isLocal.value ? '/' + code : ('/square/' + code)
    router.push(url)
}
</script>

<template>
    <div id="main-left">
        <div id="drag-zone">
            <WinTrafficLightBtn v-show="!isMacOS"></WinTrafficLightBtn>
        </div>
        <div id="platform">
            <ul>
                <li v-for="(nav,index) in platforms" 
                    :class="{ active: currentPlatformIndex == index }"
                    @click="updateNavIndex(index)" >
                    {{ nav.name }}
                </li>
            </ul>
        </div>
        <div id="app-mark">
            <div id="app-logo" >L</div>
            <div id="app-title" >Less Player</div>
        </div>
    </div>
</template>

<style>
#main-left {
    width: 16.5%;
    height: 100%;
    box-shadow: 0px 0px 3px #181818;
}

#drag-zone {
    -webkit-app-region: drag;
    height: 65px;
    margin-bottom: 6px;
}

#platform ul {
    list-style: none;
    text-align: left;
    line-height: 32px;
    padding-left: 10%;
}

#platform li {
    text-decoration: none;
    width: 75%;
    margin-bottom: 10.5px;
    padding-left: 15%;
    cursor: pointer;
    border-radius: 5px;
}

#platform li:hover {
    background-color: #464646 !important;
}

#platform .active {
    background: linear-gradient(to top right, #28c83f, #1ca388);
}

#app-mark {
    position: absolute;
    bottom: 25px;
    width: 16.5%;
    display: flex;
    align-items: center;
    justify-content: center;
}

#app-logo {
    /*
    padding: 6px 10px;
    */
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10rem 0 10rem 10rem;
    border: 0px solid;
    font-weight: bold;
    background: linear-gradient(to right top, #1ca388, #28c83f);
}

#app-title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}
</style>