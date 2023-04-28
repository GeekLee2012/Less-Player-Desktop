<script setup>
import { onMounted, ref } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';



const { hideAllCtxMenus, hideAddToListSubmenu, hideArtistListSubmenu } = useAppCommonStore()

const props = defineProps({
    posStyle: Object,
    data: Array
})

const handleMenuItem = (item, index, event) => {
    if (!item.action) return
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
</template>

<style>
.common-ctx-submenu {
    position: absolute;
    z-index: 101;
    display: flex;
    flex-direction: column;
    align-items: center;
    /*justify-content: center;*/
    background: var(--ctx-menu-bg);
    border-radius: 8px;
    /*padding: 15px 0px;
    max-height: 297px;
    border: 1px solid var(--border-color);*/
    box-shadow: 0px 0px 8px var(--ctx-menu-border-color);
}

.common-ctx-submenu .padding {
    height: 15px;
}

.common-ctx-submenu .center {
    overflow: auto;
    max-height: 267px;
}

.common-ctx-submenu .menuItem {
    width: 139px;
    display: flex;
    flex-direction: row;
    align-items: center;
    /*font-size: 14px;*/
    padding: 9px 20px;
    height: 20px;
}

.common-ctx-submenu .menuItem:hover {
    background-color: var(--text-sub-color);
    background: var(--btn-bg);
    color: var(--svg-btn-color);
}

.common-ctx-submenu .menuItem:hover svg {
    fill: var(--svg-btn-color);
}

.common-ctx-submenu .menuItem>div {
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
    white-space: pre-wrap;
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