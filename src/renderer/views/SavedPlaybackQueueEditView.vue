<script>
//定义名称，方便用于<keep-alive>
export default { name: 'SavedPlaybackQueueEditView' }
</script>

<script setup>
import { onMounted, ref, reactive, inject, computed, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { usePlaybackQueueStore } from '../store/playbackQueueStore';
import { toTrimString, coverDefault, isSupportedImage, ipcRendererInvoke } from '../../common/Utils';
import ArtistControl from '../components/ArtistControl.vue';
import AlbumControl from '../components/AlbumControl.vue';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const { showToast, showFailToast, setRouterCtxCacheItem } = useAppCommonStore()
const { routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const { getQueue, addQueue, updateQueue } = usePlaybackQueueStore()
const { queueTracks } = storeToRefs(usePlayStore())

const titleRef = ref(null)
const invalid = ref(false)
const detail = reactive({ title: '', about: '', cover: '' })
const isActionDisabled = ref(false)
const setActionDisabled = (value) => isActionDisabled.value = value



const loadContent = () => {
    const { id } = props
    if (!id) return
    const item = getQueue(id)
    if (!item) return
    const { title, about, cover } = item
    Object.assign(detail, { id, title, about, cover })
}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = async () => {
    let { title, about, cover } = detail
    if (title.length < 1) {
        invalid.value = true
        return
    }

    const { id } = props
    const text = (!id ? '播放队列已保存' : '播放队列已更新')
    if (!id) {
        const tracks = queueTracks.value
        if(!tracks || tracks.length < 1) return showFailToast('当前播放队列为空')

        const data = [...toRaw(tracks)]
        const excludeProps = ['lyric', 'lyricTran', 'lyricTrans', 
                    'lyricRoma', 'score', 'isCandidate']
        data.forEach(item => {
            excludeProps.forEach(prop => Reflect.deleteProperty(item, prop))
        })
        addQueue({ title, about, cover, data })
    } else {
        updateQueue({ id, title, cover, about })
    }
    setActionDisabled(true)
    showToast(text)
    backward()
}

const cancel = () => {
    if (routerCtxCacheItem.value) setRouterCtxCacheItem(null)
    backward()
}

const setupCover = (cover) => {
    return Object.assign(detail, { cover })
}

const updateCover = async () => {
    const result = await ipcRendererInvoke('open-image')
    if (result.length > 0) setupCover(result[0])
}

const onDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length > 1) return showFailToast('还不支持多文件拖拽')

    const { path } = files[0]
    if (isSupportedImage(path)) {
        setupCover(path)
        event.stopPropagation()
    }
}


/* 生命周期、监听 */
onMounted(() => loadContent())
</script>

<template>
    <div id="saved-playbackQueue-edit-view" @drapover="(e) => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <span class="title" v-show="!id">保存播放队列</span>
            <span class="title" v-show="id">编辑播放队列</span>
        </div>
        <div class="center">
            <div class="left">
                <img class="cover" v-lazy="coverDefault(detail.cover)" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>队列名称</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.title" ref="titleRef" :class="{ invalid }" maxlength="99"
                            placeholder="队列名称，最多支持输入99个字符" />
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
                            placeholder="播放队列描述，最多支持输入1024个字符">
                        </textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton  text="保存" 
                        :leftAction="submit"
                        :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton text="取消" 
                        class="spacing" 
                        :leftAction="cancel" 
                        :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#saved-playbackQueue-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
}

#saved-playbackQueue-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
}

#saved-playbackQueue-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#saved-playbackQueue-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#saved-playbackQueue-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: var(--border-inputs-border-radius);
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#saved-playbackQueue-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 6px;
    border-radius: var(--border-inputs-border-radius);
    cursor: pointer;
    margin-top: 2px;
}

#saved-playbackQueue-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#saved-playbackQueue-edit-view .center .form-row {
    margin-bottom: 15px;
}

#saved-playbackQueue-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#saved-playbackQueue-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#saved-playbackQueue-edit-view .center .form-row input,
#saved-playbackQueue-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    outline: none;
    padding: 5px 8px;
    border-radius: var(--border-inputs-border-radius);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    font-size: var(--content-text-size);
}

#saved-playbackQueue-edit-view .center .form-row input {
    height: 28px;
}

#saved-playbackQueue-edit-view .center .form-row textarea {
    height: 200px;
    padding: 8px;
}

#saved-playbackQueue-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#saved-playbackQueue-edit-view .spacing {
    margin-left: 20px;
}

#saved-playbackQueue-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#saved-playbackQueue-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

.contrast-mode #saved-playbackQueue-edit-view .center .cover-eidt-btn {
    font-weight: bold;
}

/*
#saved-playbackQueue-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>