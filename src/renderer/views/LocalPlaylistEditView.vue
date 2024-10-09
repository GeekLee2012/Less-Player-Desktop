<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'LocalPlaylistEditView'
}
</script>

<script setup>
import { onMounted, ref, reactive, inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { coverDefault, ipcRendererInvoke, isSupportedImage } from '../../common/Utils';


const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const { showToast, showFailToast } = useAppCommonStore()
const titleRef = ref(null)
const tagsRef = ref(null)
//const aboutRef = ref(null)
//const coverRef = ref(null)
const invalid = ref(false)
const detail = reactive({ title: '', tags: '', about: '', cover: '' })
const isActionDisabled = ref(false)
const setActionDisabled = (value) => isActionDisabled.value = value

//TODO
const { addLocalPlaylist, updateLocalPlaylist, getLocalPlaylist } = useLocalMusicStore()

const loadLocalPlaylist = () => {
    if (!props.id) return
    const id = props.id.trim()
    if (id.length < 1) return
    const playlist = getLocalPlaylist(id)
    if (!playlist) return
    const { title, tags, about, cover } = playlist
    Object.assign(detail, { id, title, tags, about, cover })
}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = () => {
    /*
    let title = titleRef.value.value.trim()
    let tags = tagsRef.value.value.trim()
    let about = aboutRef.value.value.trim()
    let cover = coverRef.value.src
    */
    let { title, tags, about, cover } = detail
    if (title.length < 1) {
        invalid.value = true
        return
    }
    let text = "歌单创建成功"
    if (!props.id) {
        addLocalPlaylist(title, tags, about, cover)
    } else {
        updateLocalPlaylist(props.id, title, tags, about, cover)
        text = "歌单已保存"
    }
    setActionDisabled(true)
    showToast(text)
    backward()
}

const setupCover = (cover) => {
    return Object.assign(detail, { cover })
}

//TODO
const updateCover = async () => {
    const result = await ipcRendererInvoke('open-image')
    if (result.length > 0) setupCover(result[0])
}

const onDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length > 1) return showFailToast('还不支持多文件拖拽')

    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        setupCover(path)
    } else {
        //其他文件，直接放行，继续事件冒泡
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
}


/* 生命周期、监听 */
onMounted(() => loadLocalPlaylist())
</script>

<template>
    <div id="local-playlist-edit-view" @drapover="(e) => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <span class="title" v-show="!id">创建本地歌单</span>
            <span class="title" v-show="id">编辑本地歌单</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="coverDefault(detail.cover)" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
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
                <div class="form-row" v-show="false">
                    <div>
                        <span>标签</span>
                        <span class="required"> （暂时还不支持）</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.tags" ref="tagsRef" :class="{ invalid }" maxlength="128"
                            placeholder="标签，歌单分类；多个标签时，以英文状态下的逗号(,)分隔" />
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
                    <SvgTextButton :leftAction="submit" text="保存" :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton :leftAction="backward" text="取消" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#local-playlist-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
}

#local-playlist-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
}

#local-playlist-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#local-playlist-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#local-playlist-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: var(--border-inputs-border-radius);
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#local-playlist-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: var(--border-inputs-border-radius);
    cursor: pointer;
    margin-top: 2px;
}


#local-playlist-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#local-playlist-edit-view .center .form-row {
    margin-bottom: 17px;
}

#local-playlist-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#local-playlist-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#local-playlist-edit-view .center .form-row input,
#local-playlist-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    outline: none;
    padding: 5px 8px;
    border-radius: var(--border-inputs-border-radius);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    /*font-size: 15px; */
    font-size: var(--content-text-size);
}

#local-playlist-edit-view .center .form-row input {
    height: 28px;
}

#local-playlist-edit-view .center .form-row textarea {
    /*height: 188px;*/
    height: 193px;
    padding: 8px;
}

#local-playlist-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#local-playlist-edit-view .spacing {
    margin-left: 20px;
}

#local-playlist-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#local-playlist-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

/*
#local-playlist-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>