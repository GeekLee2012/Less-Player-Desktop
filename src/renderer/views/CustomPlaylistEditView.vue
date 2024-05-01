<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'CustomPlaylistEditView'
}
</script>

<script setup>
import { onMounted, ref, reactive, inject, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { toTrimString, useIpcRenderer, coverDefault } from '../../common/Utils';
import ArtistControl from '../components/ArtistControl.vue';
import AlbumControl from '../components/AlbumControl.vue';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const ipcRenderer = useIpcRenderer()

const { showToast, showFailToast, setRouterCtxCacheItem } = useAppCommonStore()
const { routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const titleRef = ref(null)
//const aboutRef = ref(null)
//const coverRef = ref(null)
const invalid = ref(false)
const detail = reactive({ title: '', about: '', cover: '' })
const isActionDisabled = ref(false)
const setActionDisabled = (value) => isActionDisabled.value = value

//TODO
const { addCustomPlaylist, updateCustomPlaylist,
    getCustomPlaylist, moveToCustomPlaylist } = useUserProfileStore()

const loadCustomPlaylist = () => {
    if (!props.id) return
    const id = props.id.trim()
    if (id.length < 1) return
    const playlist = getCustomPlaylist(id)
    if (!playlist) return
    const { title, about, cover } = playlist
    Object.assign(detail, { id, title, about, cover })
}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = (isWithData) => {
    /*
    let title = titleRef.value.value.trim()
    let about = aboutRef.value.value.trim()
    let cover = coverRef.value.src
    */
    let { title, about, cover } = detail
    if (title.length < 1) {
        invalid.value = true
        return
    }
    let text = "歌单创建成功", data = []
    if (!props.id) {
        let isMoveAction = false, fromId = null
        if (isWithData && routerCtxCacheItem.value
            && routerCtxCacheItem.value.id == 'createPlaylistWithData') {
            const { data: cacheData, isMoveAction: cacheMoveAction, fromId: cacheFromId } = routerCtxCacheItem.value
            text = (isMoveAction ? "歌单已创建！<br>且歌曲已移动成功" : "歌单已创建！<br>且歌曲已添加成功")
            data = cacheData
            isMoveAction = cacheMoveAction
            fromId = cacheFromId
        }
        if (isMoveAction && fromId) {
            const toId = addCustomPlaylist(title, about, cover)
            data.forEach(item => {
                moveToCustomPlaylist(toId, fromId, item)
            })
        } else {
            addCustomPlaylist(title, about, cover, data)
        }
        if (routerCtxCacheItem.value) setRouterCtxCacheItem(null)
    } else {
        updateCustomPlaylist(props.id, title, about, cover)
        text = "歌单已保存"
    }
    setActionDisabled(true)
    showToast(text)
    backward()
}

const cancel = () => {
    if (routerCtxCacheItem.value) setRouterCtxCacheItem(null)
    backward()
}

//TODO
const updateCover = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-image')
    if (result.length > 0) {
        const cover = result[0]
        Object.assign(detail, { cover })
    }
}

const computedAddWithDataAvailable = computed(() => {
    if (!routerCtxCacheItem.value) return false
    const { id, data } = routerCtxCacheItem.value
    if(id != 'createPlaylistWithData' || !data) return false
    if(Array.isArray(data)) return data.length > 0
    return true
})

const computedCacheTitle = computed(() => {
    if (!routerCtxCacheItem.value) return
    const { isMoveAction } = routerCtxCacheItem.value
    return isMoveAction ? '待移动歌曲' : '待添加歌曲'
})


const computedSumbitText = computed(() => {
    if (!routerCtxCacheItem.value) return
    const { isMoveAction } = routerCtxCacheItem.value
    return isMoveAction ? '保存并移动歌曲' : '保存并添加歌曲'
})


const computedRouterCache = computed(() => {
    if (!routerCtxCacheItem.value) return []

    const { id, data } = routerCtxCacheItem.value
    if (id != 'createPlaylistWithData') return []

    const cache = []
    if (Array.isArray(data)) {
        cache.push(...data)
    } else if (data) {
        cache.push(data)
    }
    return cache
})

const shortenCacheData = (data) => {
    if (!data || !Array.isArray(data)) return []
    if (data.length <= 5) return data
    return [data[0], data[1], { title: '......' }, data[data.length - 2], data[data.length - 1]]
}

onMounted(() => loadCustomPlaylist())
</script>

<template>
    <div id="custom-playlist-edit-view">
        <div class="header">
            <span class="title" v-show="!id">创建歌单</span>
            <span class="title" v-show="id">编辑歌单</span>
        </div>
        <div class="center">
            <div class="left">
                <img class="cover" v-lazy="coverDefault(detail.cover)" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
                <div class="cache-data" v-show="computedRouterCache.length > 0">
                    <div class="content-text-highlight">{{ computedCacheTitle }}({{ computedRouterCache.length }})</div>
                    <div v-for="(item, index) in shortenCacheData(computedRouterCache)" class="cache-item"
                        v-html="toTrimString(item.title)">
                    </div>
                </div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>歌单名</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.title" ref="titleRef" :class="{ invalid }" maxlength="99"
                            placeholder="歌单名称，最多支持输入99个字符" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>封面图片</span></div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.cover" placeholder="封面图片URL，支持本地文件URL、在线URL" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea v-model="detail.about" maxlength="1024"
                            placeholder="歌单描述，你想用歌单诉说什么，一起分享一下吧 ~ 最多支持输入1024个字符">
                        </textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="() => submit()" text="保存" :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton v-show="computedAddWithDataAvailable" :leftAction="() => submit(true)"
                        :text="computedSumbitText" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton :leftAction="cancel" text="取消" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#custom-playlist-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
}

#custom-playlist-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
}

#custom-playlist-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#custom-playlist-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#custom-playlist-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#custom-playlist-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
}


#custom-playlist-edit-view .center .left .cache-data {
    margin-top: 36px;
    width: 175px;
    line-height: var(--content-text-line-height);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    text-align: left;
    vertical-align: middle;
}

#custom-playlist-edit-view .center .left .cache-data .content-text-highlight {
    font-weight: bold;
    margin-bottom: 3px;
}

#custom-playlist-edit-view .center .left .cache-item {
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: var(--content-subtitle-text-color);
}

#custom-playlist-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#custom-playlist-edit-view .center .form-row {
    margin-bottom: 15px;
}

#custom-playlist-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#custom-playlist-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#custom-playlist-edit-view .center .form-row input,
#custom-playlist-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    outline: none;
    padding: 5px 8px;
    border-radius: 2px;
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    /*font-size: 15px; */
    font-size: var(--content-text-size);
}

#custom-playlist-edit-view .center .form-row input {
    height: 25px;
}

#custom-playlist-edit-view .center .form-row textarea {
    height: 200px;
    padding: 8px;
}

#custom-playlist-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#custom-playlist-edit-view .spacing {
    margin-left: 20px;
}

#custom-playlist-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#custom-playlist-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

/*
#custom-playlist-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>