<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import { usePlatformStore } from '../store/platformStore';
import ToggleControl from '../components/ToggleControl.vue';
import { computed } from 'vue';



const { platforms } = storeToRefs(usePlatformStore())
const { toggleModulesPlaylistsOff,
    toggleModulesArtistsOff,
    toggleModulesRadiosOff,
    toggleModulesSearchOff } = useSettingStore()
const { isModulesPlaylistsOff,
    isModulesArtistsOff,
    isModulesRadiosOff,
    isModulesSearchOff } = storeToRefs(useSettingStore())

const playlistsPlatforms = computed(() => {
    return platforms.value('playlists').filter(item => (item.code != 'local'))
})
const artistsPlatforms = platforms.value('artists')
const radiosPlatforms = platforms.value('radios')
const searchPlatforms = computed(() => {
    return platforms.value('search').filter(item => (item.code != 'local'))
})

</script>

<template>
    <div id="modules-setting-view">
        <div class="header">
            <div class="title">功能管理</div>
            <div class="tip-text">提示：实验性功能，如果某个功能被全部关闭，那么该功能会被直接隐藏
            </div>
        </div>
        <div class="center">
            <div class="row">
                <span class="cate-name">分类歌单</span>
                <div class="content" v-show="playlistsPlatforms.length > 0">
                    <div v-for="(item, index) in playlistsPlatforms"
                        :class="{ last: index == playlistsPlatforms.length - 1 }">
                        <span class="cate-subtitle">{{ item.name }}：</span>
                        <ToggleControl @click="toggleModulesPlaylistsOff(item.code)"
                            :value="!isModulesPlaylistsOff(item.code)">
                        </ToggleControl>
                    </div>
                </div>
                <div class="content" v-show="playlistsPlatforms.length < 1">
                    <div class="tip-text last">还没有歌单平台，空空如也 ~</div>
                </div>
            </div>
            <div class="row">
                <span class="cate-name">万千歌手</span>
                <div class="content">
                    <div v-for="(item, index) in artistsPlatforms" :class="{ last: index == artistsPlatforms.length - 1 }">
                        <span class="cate-subtitle">{{ item.name }}：</span>
                        <ToggleControl @click="toggleModulesArtistsOff(item.code)" :value="!isModulesArtistsOff(item.code)">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="row">
                <span class="cate-name">相约电波</span>
                <div class="content">
                    <div v-for="(item, index) in radiosPlatforms" :class="{ last: index == radiosPlatforms.length - 1 }">
                        <span class="cate-subtitle">{{ item.name }}：</span>
                        <ToggleControl @click="toggleModulesRadiosOff(item.code)" :value="!isModulesRadiosOff(item.code)">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="row last-row">
                <span class="cate-name">搜索</span>
                <div class="content" v-show="searchPlatforms.length > 0">
                    <div v-for="(item, index) in searchPlatforms" :class="{ last: index == searchPlatforms.length - 1 }">
                        <span class="cate-subtitle">{{ item.name }}：</span>
                        <ToggleControl @click="toggleModulesSearchOff(item.code)" :value="!isModulesSearchOff(item.code)">
                        </ToggleControl>
                    </div>
                </div>
                <div class="content" v-show="searchPlatforms.length < 1">
                    <div class="tip-text last">还没有搜索平台，空空如也 ~</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#modules-setting-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: scroll;
    overflow-x: hidden;
}

#modules-setting-view .spacing {
    margin-left: 25px;
}

#modules-setting-view .header .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 20px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid transparent;
}

#modules-setting-view .header .tip-text {
    margin-left: 35px;
}

#modules-setting-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#modules-setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 1px solid var(--border-color);
}

#modules-setting-view .center .last-row {
    border-color: transparent;
}

#modules-setting-view .center .row>.cate-name {
    font-size: var(--content-text-tab-title-size);
    margin-left: 10px;
    width: 128px;
}

#modules-setting-view .content,
#modules-setting-view .content>div {
    flex: 1;
}

#modules-setting-view .content>div {
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#modules-setting-view .content>div .cate-subtitle {
    width: 188px;
    margin-right: 25px;
}

#modules-setting-view .content .last {
    margin-bottom: 0px;
}

#modules-setting-view .center .last-row {
    border-color: transparent;
}
</style>