<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'DataBackupView'
}
</script>

<script setup>
import { inject, reactive, ref, toRef, toRaw, watch } from 'vue';
import SvgTextButton from '../components/SvgTextButton.vue';
import CheckboxTextItem from '../components/CheckboxTextItem.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import EventBus from '../../common/EventBus';
import { useSettingStore } from '../store/settingStore';
import { version } from '../../../package.json';
import { storeToRefs } from 'pinia';
import { useIpcRenderer } from '../../common/Utils';
import { toYyyymmddHhMmSs } from '../../common/Times';
import { useAppCommonStore } from '../store/appCommonStore';



const { backward } = inject('appRoute')

const userProfileStore = useUserProfileStore()
const settingStore = useSettingStore()
const { getCustomPlaylists } = storeToRefs(useUserProfileStore())
const ipcRenderer = useIpcRenderer()
const { showToast } = useAppCommonStore()

const isCheckedAll = ref(true)
const isReady = ref(true)

const sources = reactive([{
    id: "favorites",
    name: "我的收藏",
    children: [{
        id: "songs",
        name: "歌曲",
        checked: true
    }, {
        id: "playlists",
        name: "歌单",
        checked: true
    }, {
        id: "albums",
        name: "专辑",
        checked: true
    }, {
        id: "radios",
        name: "电台",
        checked: true
    }],
    showSuffix: true,
    checked: true,
}, {
    id: "customPlaylists",
    name: "创建的歌单",
    showSuffix: true,
    checked: true,
}, {
    id: "follows",
    name: "我的关注",
    children: [{
        id: "artists",
        name: "歌手",
        checked: true
    }],
    showSuffix: true,
    checked: true,
}, {
    id: "recents",
    name: "最近播放",
    children: [{
        id: "songs",
        name: "歌曲",
        checked: true
    }, {
        id: "playlists",
        name: "歌单",
        checked: true
    }, {
        id: "albums",
        name: "专辑",
        checked: true
    }, {
        id: "radios",
        name: "电台",
        checked: true
    }],
    showSuffix: true,
    checked: true,
}, {
    id: "user",
    name: "用户信息",
    showSuffix: false,
    checked: true,
}, {
    id: "setting",
    name: "设置",
    showSuffix: false,
    checked: true,
}])

const checkedLength = reactive({
    favorites: 4,
    follows: 1,
    recents: 4
})

const updateCheckedLength = () => {
    for (var i = 0; i < sources.length; i++) {
        const children = sources[i].children
        if (!children) continue

        const id = sources[i].id
        const checked = sources[i].checked
        if (checked) {
            checkedLength[id] = children.length
            continue
        }
        let length = 0
        for (var j = 0; j < children.length; j++) {
            if (children[j].checked) ++length
        }
        checkedLength[id] = length
    }
}

const setReady = (value) => {
    isReady.value = value
}

const setCheckedAll = (value) => {
    isCheckedAll.value = value
}

const toggleCheckAll = () => {
    setCheckedAll(!isCheckedAll.value)
    const checked = isCheckedAll.value
    //setReady(checked)
    for (var i = 0; i < sources.length; i++) {
        updateItemChecked(i, checked, sources[i].id, true)
    }
}

const backup = async () => {
    if (!ipcRenderer) return

    const backupSource = {}
    //const settingPaths = ['theme', 'track', 'cache', 'tray', 'navigation', 'dialog', 'keys']
    for (var i = 0; i < sources.length; i++) {
        const id = sources[i].id
        const checked = sources[i].checked
        const children = sources[i].children

        backupSource[id] = {}
        if (id === "user") {
            if (!checked) continue
            backupSource[id] = userProfileStore.$state[id]
        } else if (id === "setting") {
            if (!checked) continue
            const settingPaths = Object.keys(toRaw(settingStore.$state))
            for (var j = 0; j < settingPaths.length; j++) {
                const path = settingPaths[j]
                if ('other|blackHole'.includes(path)) continue
                backupSource[id][path] = settingStore.$state[path]
            }
        } else if (id === "customPlaylists") {
            backupSource[id] = []
            if (!checked) continue
            backupSource[id] = userProfileStore.$state[id]
        } else if (checked) {
            backupSource[id] = userProfileStore.$state[id]
        } else if (children) {
            for (var j = 0; j < children.length; j++) {
                const childId = children[j].id
                const checked = children[j].checked
                if (!checked) continue
                backupSource[id][childId] = userProfileStore.$state[id][childId]
            }
        }
    }

    const now = Date.now()
    const backupData = {
        appVersion: version,
        created: now,
        data: backupSource
    }
    const timestamp = toYyyymmddHhMmSs(now).replace(/-/g, '').replace(/ /g, '-').replace(/:/g, '')
    const filename = "Less.Player.Backup-" + timestamp + ".json"
    const result = await ipcRenderer.invoke("save-file", {
        title: "数据备份",
        name: filename,
        data: JSON.stringify(backupData)
    }
    )
    if (result) showToast("数据已备份成功!")
}

const hasChildren = (item) => {
    return item.children && item.children.length > 0
}

const getChildItemId = (item, child) => {
    return item.id + "." + child.id
}

const getChildItemSuffix = (id, subId) => {
    const state = userProfileStore.$state[id][subId]
    const length = state ? state.length : 0
    return `(${length})`
}

const updateCheckedAll = (isTriggerChecked) => {
    if (!isTriggerChecked) {
        setCheckedAll(false)
        setReady(false)
        return
    }
    let checked = true
    for (var i in sources) {
        checked = checked && sources[i].checked
    }
    setCheckedAll(checked)
}

const updateItemChecked = (index, checked, id, selfRefresh) => {
    let item = sources[index]
    item.checked = checked
    if (selfRefresh) EventBus.emit("checkeboxTextItem-refresh", { id: item.id, checked })
    for (var i in item.children) {
        const child = item.children[i]
        child.checked = checked
        const childId = id + "." + child.id
        EventBus.emit("checkeboxTextItem-refresh", { id: childId, checked })
    }
}

const onItemCheckChanged = (index, checked, id) => {
    updateItemChecked(index, checked, id)
    updateCheckedAll(checked)
}

const onChildItemCheckChanged = (parentIndex, index, checked, id) => {
    let parent = sources[parentIndex]
    parent.children[index].checked = checked
    let all = true
    for (var i in parent.children) {
        all = all && parent.children[i].checked
    }
    const ov = parent.checked
    parent.checked = all
    if (ov != all) {
        EventBus.emit("checkeboxTextItem-refresh", { id: parent.id, checked: all })
    }
    updateCheckedAll(checked)
}

const checkReady = () => {
    for (var i = 0; i < sources.length; i++) {
        if (sources[i].checked) {
            setReady(true)
            return
        }
        const children = sources[i].children
        if (children) {
            for (var j = 0; j < children.length; j++) {
                if (children[j].checked) {
                    setReady(true)
                    return
                }
            }
        }
    }
    setReady(false)
}

watch(sources, () => {
    checkReady()
    updateCheckedLength()
})
</script>

<template>
    <div id="data-backup-view">
        <div class="header">
            <div class="title">数据备份</div>
            <div class="action">
                <div class="checkallbox">
                    <svg @click="toggleCheckAll" v-show="!isCheckedAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg @click="toggleCheckAll" v-show="isCheckedAll" class="checked-svg" width="16" height="16"
                        viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span @click="toggleCheckAll">{{ (isCheckedAll ? "取消全选" : "全选") }}</span>
                </div>
                <SvgTextButton :isDisabled="!isReady" text="开始备份" :leftAction="backup">
                </SvgTextButton>
                <SvgTextButton text="完成" :leftAction="backward" class="to-right"></SvgTextButton>
            </div>
        </div>
        <div class="center">
            <div v-for="(item, index) in sources">
                <CheckboxTextItem :index="index" :id="item.id" :text="item.name" :checked="item.checked"
                    :checkChangedFn="(id, checked, index) => onItemCheckChanged(index, checked, id)"
                    :isParent="hasChildren(item)">
                    <template #suffix>
                        <div class="length" v-show="item.showSuffix">
                            <span v-show="item.id == 'customPlaylists'">{{ '(' + getCustomPlaylists.length + ')' }}</span>
                            <span v-show="item.id != 'customPlaylists'">({{ checkedLength[item.id] }} / {{ item.children
                                ? item.children.length : 0
                            }})</span>
                        </div>
                    </template>
                    <template #children>
                        <div v-for="(child, cIndex) in item.children" v-show="hasChildren(item)">
                            <CheckboxTextItem :index="cIndex" :id="getChildItemId(item, child)" :text="child.name"
                                :checked="child.checked"
                                :checkChangedFn="(id, checked, childIndex) => onChildItemCheckChanged(index, childIndex, checked, id)">
                                <template #suffix>
                                    <div class="length" v-html="getChildItemSuffix(item.id, child.id)"></div>
                                </template>
                            </CheckboxTextItem>
                        </div>
                    </template>
                </CheckboxTextItem>
            </div>
        </div>
    </div>
</template>

<style>
#data-backup-view {
    padding: 25px 0px 15px 0px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#data-backup-view .header {
    margin: 0px 33px 5px 33px;
}

#data-backup-view .header .title {
    text-align: left;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
    padding-bottom: 15px;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
}

#data-backup-view .action {
    display: flex;
    flex-direction: row;
    position: relative;
}

#data-backup-view .action .checkallbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 25px;
}

#data-backup-view .action .checkallbox svg {
    fill: var(--svg-color);
    cursor: pointer;
}

#data-backup-view .action .checkallbox .checked-svg {
    fill: var(--hl-color);
}

#data-backup-view .action .checkallbox>span {
    text-align: left;
    margin: 0px 20px;
    width: 65px;
    width: 80px;
    cursor: pointer;
}

#data-backup-view .action .to-right {
    position: absolute;
    right: 33px;
}

#data-backup-view .center {
    display: flex;
    flex-direction: column;
    padding: 0px 33px 0px 33px;
    overflow: scroll;
}

#data-backup-view .center .length {
    vertical-align: middle;
    margin-left: 3px;
}
</style>