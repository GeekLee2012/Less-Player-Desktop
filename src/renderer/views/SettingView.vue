<script setup>
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import { storeToRefs } from 'pinia';
import KeysInputControl from '../components/KeysInputControl.vue';
import SvgTextButton from '../components/SvgTextButton.vue';
import packageCfg from '../../../package.json';
import { useMainViewStore } from '../store/mainViewStore';

const ipcRenderer = electronAPI.ipcRenderer

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

const { showToast } = useMainViewStore()

const visitAuthor = () => {
    const url = 'https://github.com/GeekLee2012/'
    ipcRenderer.send('visit-link', url)
}

const clearSettingsCache = () => {
    ["setting", "settings"].forEach(key => {
        localStorage.removeItem(key)
    })
    showToast("当前设置缓存已清空！")
}
</script>

<template>
    <div id="setting-view">
        <div class="title">设置</div>
        <div class="center">
            <div class="theme row">
                <b>主题</b>
                <div class="content">
                    <div class="last" v-for="(item,index) in theme.data" 
                        :class="{ active: index == theme.index, lightText: item.dark }"
                        :style="{ background: item.bg }" 
                        @click="setThemeIndex(index)" >
                        <b>{{ item.name }}</b>
                    </div>
                </div>
            </div>
            <div class="track row">
                <b>播放歌曲</b>
                <div class="content">
                    <div>
                        <b>优先音质：</b>
                        <span v-for="(item,index) in track.quality.data"
                            :class="{ active: index == track.quality.index }"
                            @click="setTrackQualityIndex(index)" >
                            {{ item.name }}
                        </span>
                    </div>
                    <div>
                        <b>VIP歌曲尝试切换为免费版本：</b>
                        <ToggleControl @click="toggleVipTransfer" 
                            :value="track.vipTransfer">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>歌单分类栏，随机显示分类：</b>
                        <ToggleControl @click="toggleCategoryBarRandom" 
                            :value="track.categoryBarRandom">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <b>播放歌曲时，防止系统睡眠：</b>
                        <ToggleControl @click="togglePlayingWithoutSleeping" 
                            :value="track.playingWithoutSleeping">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="row">
                <b>缓存</b>
                <div class="content">
                    <div>
                        <b>应用退出前，保存播放状态：</b>
                        <ToggleControl @click="toggleStorePlayState"
                            :value="cache.storePlayState">
                        </ToggleControl>
                    </div>
                    <div>
                        <b>应用退出前，保存本地歌曲：</b>
                        <ToggleControl @click="toggleStoreLocalMusic"
                            :value="cache.storeLocalMusic">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <SvgTextButton text="清空设置页缓存" :left-action="clearSettingsCache">
                        </SvgTextButton>
                        <span class="tip-text">（提示：清空缓存，不影响当前设置；主要解决新版本设置不起作用问题）</span>
                    </div>
                    <!--
                    <div class="last">
                        <b>缓存根目录：</b>
                    </div>
                    -->
                </div>
            </div>
            <div class="row">
                <b>菜单栏</b>
                <div class="content">
                    <div class="last">
                        <b>在菜单栏（系统托盘）显示：</b>
                        <ToggleControl @click="toggleTrayMenu"
                            :value="tray.showMenu">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="keys row">
                <b>快捷键</b>
                <div class="content">
                    <div>
                        <b>开启全局快捷键：</b>
                        <ToggleControl @click="toggleKeysGlobal"
                            :value="keys.global" >
                        </ToggleControl>
                        <SvgTextButton text="恢复默认"></SvgTextButton>
                    </div>
                    <div v-for="(item,index) in keys.data"
                        :class="{ last: index == (keys.data.length - 1) }" >
                        <b>{{ item.name }}：</b>
                        <KeysInputControl :value="item.binding"></KeysInputControl>
                        <KeysInputControl class="global-keys-ctrl" v-show="keys.global"></KeysInputControl>
                    </div>
                </div>
            </div>
            <div class="row">
                <b>版本</b>
                <div class="content">
                    {{ packageCfg.version }}
                </div>
            </div>
            <div class="row last-row">
                <b>关于</b>
                <div class="about"><a @click.prevent="visitAuthor" href="#">RIVE2012</a></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#setting-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: auto;
}

#setting-view .tip-text {
    font-size: 14px;
    margin-left: 15px;
    color: var(--text-sub-color);
}

#setting-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 25px;
    font-size: 25px;
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center .last-row {
    border-color: transparent;
}

#setting-view .center .row > b {
    font-size: 16.5px;
    font-weight: bold;
    width: 125px;
    font-weight: normal;
}

#setting-view .content > div {
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .content > div b {
    width: 215px;
    font-weight: normal;
}

#setting-view .content .last {
    margin-bottom: 0px;
}

#setting-view .theme .content {
    display: flex;
    flex-direction: row;
}

#setting-view .theme .content div {
    --size: 50px;
    width: var(--size);
    height: var(--size);
    border-radius: 5px;
    box-shadow: 0px 0px 10px #212121;
    text-align: center;
    margin-right: 23px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid transparent;
}

#setting-view .theme .content div b{
    background-color: #16161656;
    line-height: var(--size);
    border-radius: 5px;
    visibility: hidden;
}

#setting-view .theme .content div:hover b{
    visibility: visible;
}

#setting-view .theme .content .active {
    border-color: #ffd700;
}

#setting-view .theme .content .lightText {
    color: #fff !important;
}

#setting-view .track .content span {
    width: 56px;
    padding: 6px;
    text-align: center;
    border-radius: 10rem;
    margin-right: 20px;
    border: 1px solid var(--border-color);
    cursor: pointer;
}

#setting-view .track .content span:hover {
    background-color: var(--border-color);
}

#setting-view .track .content .active {
    background: var(--btn-bg);
    color: var(--svg-btn-color);
    /*border: 1px solid var(--border-color);*/
}

#setting-view .keys .global-keys-ctrl {
    margin-left: 50px;
}

#setting-view .keys .svg-text-btn {
    margin-left: 188px;
}

#setting-view .center .about a {
    text-decoration: none;
    color: var(--text-color);
}
</style>