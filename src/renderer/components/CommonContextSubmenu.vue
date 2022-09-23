<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import EventBus from '../../common/EventBus';
import { useMainViewStore } from '../store/mainViewStore';

const { hideAddToListSubmenu, showToast, hideCommonCtxMenu } = useMainViewStore()

const props = defineProps({
    posStyle: Object,
    data: Array
})

const handleMenuItem = (item, index, event) => {
    if(!item.action) return
    item.action(item, index, event)
    showToast("歌曲已添加成功！")
    hideAddToListSubmenu()
    hideCommonCtxMenu()
}

</script>

<template>
    <div class="common-ctx-submenu" :style="posStyle" 
        @click.stop="">
        <div class="center">
            <template v-for="(item, index) in data">
                <div class="menuItem" @click="(event) => handleMenuItem(item, index, event)" v-show="!item.separator">
                    <div v-html="item.icon" v-show="item.icon"></div>
                    <div><span>{{ item.name }}</span></div>
                </div>
                <div class="separator" v-show="item.separator"></div>
            </template>
        </div>
    </div>
</template>

<style>
.common-ctx-submenu {
    position: absolute;
    z-index: 102;
    display: flex;
    flex-direction: column;
    align-items: center;
    /*justify-content: center;*/
    background: var(--ntf-bg);
    border-radius: 8px;
    padding: 15px 0px;
    border: 0.1px solid var(--border-color);
    box-shadow: 0px 0px 1px var(--ctx-menu-border-color);
    max-height: 297px;
    overflow: auto;
}

.common-ctx-submenu .menuItem {
    width: 139px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 14px;
    padding: 9px 20px;
}

.common-ctx-submenu .menuItem:hover {
    background-color: var(--text-sub-color);
    background: var(--btn-bg);
    color: var(--svg-btn-color);
}

.common-ctx-submenu .menuItem:hover svg {
    fill: var(--svg-btn-color);
}

.common-ctx-submenu .menuItem > div {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.common-ctx-submenu .menuItem svg {
    margin-right: 15px;
    fill: var(--text-color); 
}

.common-ctx-submenu .menuItem span {
    text-align: left;
    overflow: hidden;
    word-wrap: break-all;
    white-space:pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.common-ctx-submenu .separator {
    margin: 3px 15px;
    height: 0px;
    border-bottom: 0.36px solid var(--border-color);
}
</style>