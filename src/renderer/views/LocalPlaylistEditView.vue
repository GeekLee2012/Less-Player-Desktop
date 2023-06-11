<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'LocalPlaylistEditView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated, ref, reactive, watch, inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { useIpcRenderer } from '../../common/Utils';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const ipcRenderer = useIpcRenderer()

const { showToast } = useAppCommonStore()
const titleRef = ref(null)
const tagsRef = ref(null)
const aboutRef = ref(null)
const coverRef = ref(null)
const invalid = ref(false)
const detail = reactive({ title: null, tags: null, about: null, cover: null })

//TODO
const { addLocalPlaylist, updateLocalPlaylist, getLocalPlaylist } = useLocalMusicStore()

const loadLocalPlaylist = () => {
    if (!props.id) return
    const id = props.id.trim()
    if (id.length < 1) return
    const playlist = getLocalPlaylist(id)
    if (!playlist) return
    const { title, tags, about, cover } = playlist
    Object.assign(detail, { id })
    if (cover) Object.assign(detail, { cover })
    if (tags) Object.assign(detail, { tags })
    if (title) Object.assign(detail, { title })
    if (about) Object.assign(detail, { about })
}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = () => {
    let title = titleRef.value.value.trim()
    let tags = tagsRef.value.value.trim()
    let about = aboutRef.value.value.trim()
    let cover = coverRef.value.src
    if (title.length < 1) {
        invalid.value = true
        return
    }
    let text = "歌单已创建成功!"
    if (!props.id) {
        addLocalPlaylist(title, tags, about, cover)
    } else {
        updateLocalPlaylist(props.id, title, tags, about, cover)
        text = "歌单已保存!"
    }
    showToast(text, backward)
}

//TODO
const updateCover = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-image')
    if (result.length > 0) {
        const title = titleRef.value.value.trim()
        const tags = tagsRef.value.value.trim()
        const about = aboutRef.value.value.trim()
        const cover = result[0]
        Object.assign(detail, { title, tags, about, cover })
    }
}

onMounted(() => loadLocalPlaylist())

</script>

<template>
    <div id="local-playlist-edit-view">
        <div class="header">
            <span class="title" v-show="!id">创建本地歌单</span>
            <span class="title" v-show="id">编辑本地歌单</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="detail.cover" ref="coverRef" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>歌单名</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" :value="detail.title" ref="titleRef" :class="{ invalid }" maxlength="99"
                            placeholder="歌单名称，最多允许输入99个字符哦" />
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <span>标签</span>
                        <span class="required"> （暂时还不支持）</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" :value="detail.tags" ref="tagsRef" :class="{ invalid }" maxlength="99"
                            placeholder="标签，歌单分类；多个标签时，以英文状态下的逗号(,)分隔" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea :value="detail.about" ref="aboutRef" maxlength="1024"
                            placeholder="歌单描述，你想用歌单诉说什么，一起分享一下吧 ~ 最多允许输入1024个字符哦">
                                </textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="保存"></SvgTextButton>
                    <SvgTextButton :leftAction="backward" text="取消" class="spacing"></SvgTextButton>
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
    margin-bottom: 20px;
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
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#local-playlist-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
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
    border-radius: 2px;
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    /*font-size: 15px; */
    font-size: var(--content-text-size);
}

#local-playlist-edit-view .center .form-row input {
    height: 25px;
}

#local-playlist-edit-view .center .form-row textarea {
    height: 188px;
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