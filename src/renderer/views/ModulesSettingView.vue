<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import { usePlatformStore } from '../store/platformStore';
import ToggleControl from '../components/ToggleControl.vue';



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

const activeTab = ref(0)
const setActiveTab = (value) => activeTab.value = value
</script>

<template>
    <div id="modules-setting-view">
        <div class="header">
            <div class="title">功能管理</div>
            <div class="tip-text">提示：实验性功能；如果某个功能被全部关闭，那么该功能会被直接隐藏
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" v-for="(tab, index) in ['分类歌单', '万千歌手', '相约电波', '搜索']"
                    :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    @click="setActiveTab(index)" v-html="tab">
                </span>
            </div>
            <div class="content" v-show="activeTab == 0 && playlistsPlatforms.length > 0">
                <div v-for="(item, index) in playlistsPlatforms" class="toggle-item" 
                    @click="toggleModulesPlaylistsOff(item.code)">
                    <span class="cate-subtitle" v-html="item.name"></span>
                    <ToggleControl @click="toggleModulesPlaylistsOff(item.code)"
                        :value="!isModulesPlaylistsOff(item.code)">
                    </ToggleControl>
                </div>
            </div>

            <div class="content" v-show="activeTab == 1">
                <div v-for="(item, index) in artistsPlatforms" class="toggle-item"
                    @click="toggleModulesArtistsOff(item.code)">
                    <span class="cate-subtitle" v-html="item.name"></span>
                    <ToggleControl @click="toggleModulesArtistsOff(item.code)" :value="!isModulesArtistsOff(item.code)">
                    </ToggleControl>
                </div>
            </div>

            <div class="content" v-show="activeTab == 2">
                <div v-for="(item, index) in radiosPlatforms" class="toggle-item"
                    @click="toggleModulesRadiosOff(item.code)">
                    <span class="cate-subtitle" v-html="item.name"></span>
                    <ToggleControl @click="toggleModulesRadiosOff(item.code)" :value="!isModulesRadiosOff(item.code)">
                    </ToggleControl>
                </div>
            </div>

            <div class="content" v-show="activeTab == 3 && searchPlatforms.length > 0">
                <div v-for="(item, index) in searchPlatforms" class="toggle-item"
                    @click="toggleModulesSearchOff(item.code)">
                    <span class="cate-subtitle" v-html="item.name"></span>
                    <ToggleControl @click="toggleModulesSearchOff(item.code)" :value="!isModulesSearchOff(item.code)">
                    </ToggleControl>
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
    overflow: hidden;
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
    padding-bottom: 10px;
    border-bottom: 2px solid transparent;
}

#modules-setting-view .header .tip-text {
    margin-left: 35px;
}

#modules-setting-view .center {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-x: hidden;
}

#modules-setting-view .center .tab-nav {
    position: relative;
    display: flex;
    align-items: center;
    height: 36px;
    margin-left: 35px;
    margin-right: 35px;
    border-bottom: 1px solid transparent;
}

#modules-setting-view .center .tab {
    font-size: var(--content-text-tab-title-size);
    margin-right: 36px;
    padding-bottom: 5px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#modules-setting-view .center .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#modules-setting-view .center .content {
    padding: 8px 35px 15px 35px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}


#modules-setting-view .center .content .toggle-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    height: 50px;
    padding: 3px 18px;
    margin-bottom: 15px;
    box-shadow: 0px 0px 3px var(--border-popovers-border-color);
    cursor: pointer;
}

#modules-setting-view .center .content .toggle-item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#modules-setting-view .center .content .toggle-item .cate-subtitle {
    width: calc(100% - 60px);
    margin-right: 25px;
}
</style>