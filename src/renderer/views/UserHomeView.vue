<script setup>
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import { storeToRefs } from 'pinia';
import KeysInputControl from '../components/KeysInputControl.vue';
import SvgTextButton from '../components/SvgTextButton.vue';

const { theme, track, keys, tray, cache, other } = storeToRefs(useSettingStore())
const { setThemeIndex, 
    setTrackQualityIndex, 
    toggleVipTransfer,
    toggleCategoryBarRandom,
    togglePlayingWithoutSleeping,
    toggleStorePlayState,
    toggleStoreLocalMusic,
    toggleTrayMenu,
    toggleKeysGlobal,
    resetKeys
} = useSettingStore()

const ipcRenderer = electronAPI.ipcRenderer

const visitAuthor = () => {
    const url = 'https://github.com/GeekLee2012/'
    ipcRenderer.send('visit-link', url)
}
</script>

<template>
    <div id="userhome-view">
        <div class="title">我的主页Dashboard</div>
        <div class="center">
            <div class="row">
                收藏：歌单、歌手、电台、歌曲（自建歌单）
            </div>
            <div class="row">
                备份（导出）、导入
            </div>
            <div class="row">
                听歌报告：引入DB
            </div>
            <div class="row">
                大饼暂时就这么画吧~
            </div>
        </div>
    </div>
</template>

<style scoped>
#userhome-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: auto;
}

#userhome-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 25px;
    font-size: 25px;
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
}

#userhome-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#userhome-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
}

#userhome-view .center .last-row {
    border-color: transparent;
}

#userhome-view .center .row > b {
    font-size: 16.5px;
    font-weight: bold;
    width: 125px;
    font-weight: normal;
}
</style>