<script setup>
import { ref } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';



const { hideAllCtxMenus, hideAddToListSubmenu, hideArtistListSubmenu } = useAppCommonStore()

const props = defineProps({
    posStyle: Object,
    data: Array
})

const handleMenuItem = (item, index, event) => {
    if (!item || !item.action) return
    item.action(item, index, event)
    hideAllCtxMenus()
}

//TODO
const hideAllSubmenus = () => {
    hideAddToListSubmenu()
    hideArtistListSubmenu()
}

//TODO 没起作用
const submenuListRef = ref(null)
const resetScroll = () => {
    if (submenuListRef.value) submenuListRef.value.scrollTop = 0
}
</script>

<template>
    <div class="common-ctx-submenu" :style="posStyle" @click.stop="" @mouseleave="hideAllSubmenus">
        <div class="container">
            <div class="padding"></div>
            <div class="center" ref="submenuListRef">
                <template v-for="(item, index) in data">
                    <div class="menuItem" @click="(event) => handleMenuItem(item, index, event)" v-show="!item.separator">
                        <div v-html="item.icon" v-show="item.icon"></div>
                        <div><span>{{ item.name }}</span></div>
                    </div>
                    <div class="separator" v-show="item.separator && false"></div>
                </template>
            </div>
            <div class="padding"></div>
        </div>
    </div>
</template>

<style>
.common-ctx-submenu {
    position: absolute;
    z-index: 101;
    display: flex;
    /*flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 15px 0px;
    max-height: 297px;
    border: 1px solid var(--border-color);*/
    box-shadow: 0px 0px 6px var(--border-popovers-border-color);
}

.common-ctx-submenu .container {
    /*border-radius: 8px;*/
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.common-ctx-submenu .padding {
    height: 15px;
}

.common-ctx-submenu .center {
    overflow: auto;
    max-height: 267px;
}

.common-ctx-submenu .menuItem {
    /*width: 168px;
    width: 178px;*/
    width: 211px;
    display: flex;
    flex-direction: row;
    align-items: center;
    /*font-size: 14px;*/
    font-size: var(--content-text-subtitle-size);
    padding: 9px 20px;
    height: 23px;
}

.common-ctx-submenu .menuItem:hover {
    background-color: var(--content-subtitle-text-color);
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-icon-color);
}

.common-ctx-submenu .menuItem:hover svg {
    fill: var(--button-icon-text-btn-icon-color);
}

.common-ctx-submenu .menuItem>div {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.common-ctx-submenu .menuItem svg {
    margin-right: 15px;
    fill: var(--content-text-color);
}

.common-ctx-submenu .menuItem span {
    text-align: left;
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    word-wrap: break-word;
    line-break: anywhere;
}

.common-ctx-submenu .separator {
    margin: 3px 15px;
    height: 0px;
    border-bottom: 0.36px solid var(--border-color);
}

.contrast-mode .common-ctx-submenu .menuItem:hover {
    font-weight: bold;
}
</style>