<script setup>
import { computed, inject, onActivated, onDeactivated, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PluginItem from '../components/PluginItem.vue';
import { isBlank, isDevEnv, toLowerCaseTrimString, toTrimString, useIpcRenderer } from '../../common/Utils';
import { FILE_PREFIX, ActivateState } from '../../common/Constants';
import { usePluginStore } from '../store/pluginStore';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';




const { backward } = inject('appRoute')
const { activatePluginNow, deactivatePluginNow, removePluginNow } = inject('apiExpose')
const { reloadApp } = inject('player')

const ipcRenderer = useIpcRenderer()

const { plugins } = storeToRefs(usePluginStore())
const { addPlugin, updatePluginState, removePlugin } = usePluginStore()
const { showFailToast, setSearchBarExclusiveAction } = useAppCommonStore()
const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())

const checkedAll = ref(false)
const ignoreCheckAllEvent = ref(false)
const checkedData = reactive([])
const filteredData = ref(null)
const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value


const actionShowCtl = reactive({
    enableBtn: true,
    disableBtn: true,
    importBtn: true,
    deleteBtn: true,
    reloadBtn: true
})

const onCheckChanged = (checked, item) => {
    if (checked) {
        checkedData.push(item)
    } else {
        const index = checkedData.findIndex(e => (item.id == e.id))
        if (index > -1) checkedData.splice(index, 1)
    }
    ignoreCheckAllEvent.value = true
    checkedAll.value = (checkedData.length == plugins.value.length)
}

const toggleSelectAll = () => {
    if (plugins.value.length < 1) return
    ignoreCheckAllEvent.value = false
    checkedAll.value = !checkedAll.value
    checkedData.length = 0
    if (checkedAll.value) checkedData.push(...plugins.value)
}

//仅最前面的20行，尝试获取元数据
const parsePluginMetadata = (text) => {
    if (!text) return
    const lines = text.split('\n')
    const metadata = {}
    let hit = 0
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('@name')) {
            const name = toTrimString(line.split('@name')[1])
            Object.assign(metadata, { name })
            ++hit
        } else if (line.includes('@version')) {
            const version = toTrimString(line.split('@version')[1])
            Object.assign(metadata, { version })
            ++hit
        } else if (line.includes('@author')) {
            const author = toTrimString(line.split('@author')[1])
            Object.assign(metadata, { author })
            ++hit
        } else if (line.includes('@about')) {
            const about = toTrimString(line.split('@about')[1])
            Object.assign(metadata, { about })
            ++hit
        } else if (line.includes('@repository')) {
            const repository = toTrimString(line.split('@repository')[1])
            Object.assign(metadata, { repository })
            ++hit
        }
        //其他兼容注释
        else if (line.includes('@title') && !metadata.name) {
            const name = toTrimString(line.split('@title')[1])
            Object.assign(metadata, { name })
            ++hit
        }
        else if (line.includes('@developer') && !metadata.author) {
            const author = toTrimString(line.split('@developer')[1])
            Object.assign(metadata, { author })
            ++hit
        }
        else if (line.includes('@description') && !metadata.about) {
            const about = toTrimString(line.split('@description')[1])
            Object.assign(metadata, { about })
            ++hit
        }
        if (hit >= 5 || i > 20) break
    }
    return metadata
}

const doImportPlugin = async (fileItem) => {
    if (!fileItem) return
    if (!fileItem.filePath || !fileItem.data) return showFailToast('插件导入失败<br>无法读取内容')
    const { filePath, data } = fileItem
    const metadata = parsePluginMetadata(data)
    if (!metadata) return showFailToast('插件导入失败<br>无法解析元数据')
    const { name, author, version } = metadata
    if (isBlank(name)) return showFailToast('插件导入失败<br>无法解析元数据')

    const plugin = { ...metadata, type: 0 }
    let needFallback = false
    import(/* @vite-ignore */ `${FILE_PREFIX}${filePath}`).then(async mainModule => {
        const { activate, deactivate } = mainModule
        if (!activate || (typeof activate != 'function')) {
            return showFailToast('插件导入失败<br>内容不符合规范')
        }
        if (!deactivate || (typeof deactivate != 'function')) {
            return showFailToast('插件导入失败<br>内容不符合规范')
        }

        //导入插件
        const result = await ipcRenderer.invoke('app-importPlugin', { filePath, data })
        if (!result) return
        needFallback = true

        const { path, main } = result
        if (!path || !main) return

        //写入插件元数据
        Object.assign(plugin, { path, main })
        addPlugin({ ...plugin, mainModule })
        needFallback = false
    }).catch(error => {
        console.log(error)
        showFailToast('插件导入失败<br>发生未知错误')
    })
    if (needFallback) removePluginNow(plugin)
    refreshCheckData()
}

const importPlugin = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-file', { filterExts: ['js'] })
    doImportPlugin(result)
}

const enablePlugins = () => {
    if (checkedData.length < 1) return
    checkedData.forEach(plugin => activatePluginNow(plugin, () => updatePluginState(plugin, ActivateState.ACTIVATED)))
    refreshCheckData()
}

const disablePlugins = () => {
    if (checkedData.length < 1) return
    checkedData.forEach(plugin => deactivatePluginNow(plugin, () => updatePluginState(plugin, ActivateState.DEACTIVATED)))
    refreshCheckData()
}

const removePlugins = () => {
    if (checkedData.length < 1) return
    checkedData.forEach(plugin => {
        removeFromFilteredData(plugin)
        deactivatePluginNow(plugin, () => removePluginNow(plugin), () => removePluginNow(plugin))
    })
    //checkedData.length = 0
    //checkedAll.value = (plugins.value.length > 0) && (checkedData.length == plugins.value.length)
    refreshCheckData()
}

const onDrop = async (event) => {
    event.preventDefault()
    if (!ipcRenderer) return

    const { files } = event.dataTransfer
    if (files.length < 1) return
    for (var i = 0; i < files.length; i++) {
        const { name, path } = files[i]
        const result = await ipcRenderer.invoke('read-text', path)
        if (!result) continue
        doImportPlugin(result)
    }
}

const toggleUseSearchBar = () => {
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

const removeFromFilteredData = (plugin) => {
    const list = filteredData.value
    if (!plugin || !list) return
    const index = list.findIndex(item => (item.id == plugin.id))
    if (index > -1) list.splice(index, 1)
}

const filterWithKeyword = (list) => {
    let keyword = searchKeyword.value
    let result = list
    if (keyword) {
        keyword = toLowerCaseTrimString(keyword)
        result = result.filter(item => {
            const { name, author, about, repository } = item
            return toLowerCaseTrimString(name).includes(keyword)
                || toLowerCaseTrimString(author).includes(keyword)
                || toLowerCaseTrimString(about).includes(keyword)
        })
    }
    return result
}

const filterContent = () => {
    const data = plugins.value
    const listData = filterWithKeyword(data)
    filteredData.value = null
    if (listData && listData.length != data.length) {
        filteredData.value = listData
    }
}

const computedPlugins = computed(() => (filteredData.value || plugins.value))
const computedTabTip = computed(() => {
    return checkedData.length ? `已选${checkedData.length}个插件` : `共${computedPlugins.value.length}个插件`
})

const refreshCheckData = () => {
    checkedData.length = 0
    checkedAll.value = false
    EventBus.emit("plugin-checkbox-refresh")
}

onActivated(() => {
    EventBus.emit('pluginsView-show')
})

onDeactivated(() => {
    setSearchBarExclusiveAction(null)
    setSearchKeyword(null)
})

watch(searchKeyword, filterContent)
</script>

<template>
    <div id="plugins-view" @dragover="e => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <div class="title-wrap">
                <div class="title">插件管理</div>
                <div class="search-wrap checkbox text-btn" @click="toggleUseSearchBar" v-show="true">
                    <svg v-show="!searchBarExclusiveAction" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="searchBarExclusiveAction" class="checked-svg" width="16" height="16"
                        viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>独占搜索框模式</span>
                </div>
            </div>
            <div class="tip-text">提示：实验性功能；插件未生效时，请手动刷新；支持拖拽导入<br>
                <b>郑重声明：当前应用并未提供安全性检查和保障，概不承担任何插件使用时引发的一切不良后果<br>
                    插件有风险，使用需谨慎！建议不要使用任何来源不明的插件</b>
            </div>
        </div>
        <div class="center">
            <div class="action">
                <div class="checkbox checkall" :class="{ 'button-disabled': (computedPlugins.length < 1) }"
                    @click="toggleSelectAll">
                    <svg v-show="!checkedAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="checkedAll" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>{{ (checkedAll ? "取消全选" : "全选") }}</span>
                </div>
                <SvgTextButton text="导入" class="spacing" v-show="actionShowCtl.importBtn" :leftAction="importPlugin"
                    :rightAction="removePlugins">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 853.89 768.02" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.89,768q-148.75,0-297.49,0C69.87,767.93,19.57,729.67,4.61,672.5a140.41,140.41,0,0,1-4.31-34c-.44-55.67-.29-111.33-.21-167,0-31.15,27.63-51.88,56.33-42.52,17.88,5.83,29.09,22.14,29.12,42.72q.1,65.51.06,131c0,11.66,0,23.33,0,35,.13,27.13,18,45.07,45.21,45.08q143,.07,286,0,152.49,0,305,0c10.8,0,20.87-2.11,29.52-8.91,11.68-9.19,16.88-21.33,16.83-36.16-.15-43,0-86,0-129,0-12.83-.15-25.66,0-38.49.26-17.27,7.72-30.64,23.12-38.64,14.61-7.57,29.38-6.72,43.18,2.34,12.62,8.29,19,20.52,19,35.47.17,57.83.86,115.67-.21,173.49-1.18,63.32-47.07,114.32-109.5,123.77a141.79,141.79,0,0,1-20.92,1.3Q574.88,768.07,426.89,768Z" />
                                    <path
                                        d="M394.63,450.06v-5.88q0-199.47,0-398.94c0-20.15,9.91-35.63,26.85-42.21,28.37-11,58.2,9.24,58.3,40,.19,62,.06,124,.06,186V451.28c2-1.84,3.34-3,4.57-4.19Q535.69,395.84,587,344.6c18.84-18.76,47.07-18,63.7,1.39a42.31,42.31,0,0,1-1.2,56.56c-8.5,9.16-17.56,17.79-26.4,26.63Q546,506.25,468.93,583.3c-15.5,15.47-36.33,18.46-53.8,7.71a51.86,51.86,0,0,1-9.31-7.48q-89.51-89.35-178.88-178.84c-13.46-13.48-17.06-31.76-9.79-48.24a42.62,42.62,0,0,1,41.2-25.38c11.71.55,21.35,5.62,29.57,13.87q40.38,40.57,80.91,81c8.22,8.23,16.38,16.53,24.57,24.8Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                    <template #right-img>
                        <svg width="16" height="16" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="启用" class="spacing" v-show="actionShowCtl.enableBtn"
                    :leftAction="enablePlugins">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 770.66 779.07" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M389.25,779.07c-159.7-.12-300.57-94.26-359.94-238C7.08,487.28-2.83,431.21.7,373.16Q9.58,226.89,112.39,121.9c14.86-15.19,37.84-15.85,52.51-1.76,15.21,14.6,15.7,37.7.44,53.21-35.93,36.52-63,78.61-77,127.91-34.1,120.26-7.39,226.16,80.06,315.33,46.87,47.81,105.26,75.33,171.47,85.2,159.1,23.71,311.08-77.86,347.77-234.45,25.78-110.07-1.77-207.32-78.77-290.26-7.43-8-14-16-14.64-27.5-.94-15.85,7.21-29.93,21.3-36.46a36.48,36.48,0,0,1,41.55,7.42,380.44,380.44,0,0,1,63.25,82.7C746,248.55,762.2,297.09,768,348.84c9.89,88.24-7.81,170.78-54.37,246.44C665.82,673,598.21,726.86,512.25,757.5A374.22,374.22,0,0,1,389.25,779.07Z" />
                                    <path
                                        d="M422.07,208.11q0,85.26,0,170.5c0,17.27-8.62,30.59-23.1,36.4-24.65,9.89-50.71-7.94-50.7-34.91q0-129.75.29-259.5c0-27.33,0-54.66.19-82,.13-19.32,11.62-33.89,29.35-37.76C400.45-4,422.25,12.64,422.46,35.62c.36,37.83,0,75.67,0,113.5q0,29.49,0,59Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="停用" class="spacing"
                    v-show="actionShowCtl.disableBtn" :leftAction="disablePlugins">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.79,853.5C192.45,853.62.22,661.48,0,426.92S192.62-.39,426.94,0C661.68.39,853.57,192.4,853.47,426.82S661.33,853.37,426.79,853.5ZM635.25,158C512.54,58,311.4,53.78,180,191.8,49.19,329.13,65.54,523.71,158.14,635.15ZM218.16,695.51c133.64,107.39,344.4,99.78,470.12-50.39,119.65-142.91,90.61-328.33,6.9-426.64Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton text="刷新" class="spacing" v-show="actionShowCtl.reloadBtn" :leftAction="reloadApp">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 639.99 732.03" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M479.44,134.48c-5.08-19.94-9.88-38.77-14.67-57.6-3.24-12.73-6.79-25.4-9.6-38.23A31.79,31.79,0,0,1,517,23.85c5.13,19.12,9.89,38.34,14.79,57.53q18.4,72.06,36.77,144.12c.32,1.26.49,2.56.84,4.42-7.37,1.93-14.54,3.85-21.73,5.68Q456.27,259,364.85,282.25c-15.7,4-30.42-2.18-37.47-15.56-6.93-13.16-4.06-29.51,7.49-39A35.82,35.82,0,0,1,348,220.94c32.33-8.56,64.76-16.72,97.15-25,2.39-.61,4.75-1.31,7.12-2,.15-.52.31-1.05.46-1.58-13-6.13-25.76-12.94-39.09-18.28-36.45-14.61-74.53-20.64-113.59-17-85.64,8.09-152.15,48.54-198.16,121.3C73.08,324,60.12,374.49,64.5,428.08c8.1,99.16,57.39,171.64,146.57,216.12,35.77,17.84,74.23,25.25,114.16,24.54,119.41-2.11,222.53-88.31,246-205.4a261.86,261.86,0,0,0,3.73-77.56c-1.89-19.23,10.24-34.95,28.4-36.75s33,11.32,34.95,30.55c6.89,69.52-7,134.69-42.57,194.7-44,74.17-107.93,123.51-191.06,146.2C230.57,768,54.37,664.51,9.73,489.5c-43.75-171.56,64.39-349,237-388.6,80.15-18.37,156.42-7.65,228.68,31.56C476.37,133,477.41,133.48,479.44,134.48Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <div class="tab-tip content-text-highlight to-right" v-html="computedTabTip"></div>
            </div>
            <div class="content">
                <PluginItem v-for="(item, index) in computedPlugins" :data="item" :index="index" :checkbox="true"
                    :checked="checkedAll" :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkChangedFn="onCheckChanged">
                </PluginItem>
            </div>
        </div>
    </div>
</template>

<style>
#plugins-view {
    padding: 20px 0px 15px 0px;
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: hidden;
    /*
    overflow: scroll;
    overflow-x: hidden;
    */
}

#plugins-view .spacing {
    margin-left: 25px;
}

#plugins-view .header .title-wrap {
    display: flex;
    position: relative;
    margin-left: 35px;
    margin-right: 35px;
    align-items: center;
    font-weight: bold;
}

#plugins-view .header .title {
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    /*font-weight: bold;*/
    border-bottom: 2px solid transparent;
}

#plugins-view .header .search-wrap {
    position: absolute;
    right: 0px;
}

#plugins-view .header .tip-text {
    margin: 5px 0px 15px 39px;
}

#plugins-view .center {
    /*padding-left: 35px;
    padding-right: 35px;
    */
    padding-bottom: 30px;
    display: flex;
    flex-direction: column;
}

/*
#plugins-view .center>.action,
#plugins-view .center>.content {
    padding-left: 35px;
    padding-right: 35px;
}
*/


#plugins-view .center>.action {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    margin-bottom: 10px;
    margin-left: 35px;
    margin-right: 35px;
}

#plugins-view .center>.action svg {
    fill: var(--button-icon-text-btn-text-color);
}

#plugins-view .center>.action .to-right {
    position: absolute;
    right: 0px;
}

#plugins-view .center>.action .checkbox {
    flex-direction: row;
    margin-left: 8px;
    margin-right: 15px;
}

#plugins-view .center>.action .checkbox>span {
    text-align: left;
    margin: 0px 20px;
    /*width: 65px;*/
    min-width: 80px;
}

#plugins-view .center>.action .checkall span {
    margin-left: 13px;
}

#plugins-view .center>.action .tab-tip {
    font-weight: bold;
}

#plugins-view .center>.content {
    padding-left: 35px;
    padding-right: 35px;
    overflow: scroll;
    overflow-x: hidden;
}
</style>