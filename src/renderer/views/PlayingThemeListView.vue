<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';



const { setPlayingViewThemeIndex } = useAppCommonStore()
const { playingViewThemes, playingViewThemeIndex } = storeToRefs(useAppCommonStore())
</script>

<template>
    <!-- click事件: 必须阻止冒泡，因为document全局监听click事件 -->
    <div class="playing-theme-list-view" @click.stop="" ref="ptlistRef">
        <div class="container">
            <div class="header">
                <div class="title-wrap">
                    <div class="title content-text-highlight">播放样式</div>
                </div>
            </div>
            <div class="center" ref="listRef">
                <template v-for="(item, index) in playingViewThemes">
                    <div class="item" :class="{ current: playingViewThemeIndex == index }" 
                        :index="index">
                        <div>
                            <img class="preview" :src="`dynamics/${item.id}_preview.png`" 
                                @click="(event) => setPlayingViewThemeIndex(index)" />
                        </div>
                        <div>
                            <span class="text" v-html="item.name"
                                @click="(event) => setPlayingViewThemeIndex(index)" >
                            </span>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style>
.playing-theme-list-view {
    display: flex;
    -webkit-app-region: none;
    overflow: hidden;
}

.playing-theme-list-view .container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.playing-theme-list-view .header {
    padding: 20px 15px 10px 25px;
    border-bottom: none;
}

.playing-theme-list-view .header .title-wrap {
    display: flex;
    flex-direction: row;
}

.playing-theme-list-view .header .title-wrap .title {
    text-align: left;
    font-size: var(--content-text-module-subtitle-size);
    font-weight: bold;
}

.playing-theme-list-view .center {
    position: relative;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: 66px;
}

.playing-theme-list-view .center .item {
    position: relative;
    margin: 25px 33px;
}

.playing-theme-list-view .center .item .preview {
    width: 100%;
    height: 188px;
    border-radius: 3px;
    object-fit: fill;
    margin-bottom: 3px;
    border: 3.5px solid transparent;
    cursor: pointer;
}

.playing-theme-list-view .center .item .text {
    cursor: pointer;
}

.playing-theme-list-view .center .item.current .preview {
    border-color: var(--content-highlight-color);
}

.playing-theme-list-view .center .item.current .text {
    color: var(--content-highlight-color);
    font-weight: bold;
}
</style>