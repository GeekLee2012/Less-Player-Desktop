<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'CustomPlaylistEditView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated, ref, reactive, watch, inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import SvgTextButton from '../components/SvgTextButton.vue';
import { useIpcRenderer } from '../../common/Utils';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const ipcRenderer = useIpcRenderer()

const { showToast } = useAppCommonStore()
const titleRef = ref(null)
const aboutRef = ref(null)
const coverRef = ref(null)
const invalid = ref(false)
const detail = reactive({ title: null, about: null, cover: null })

//TODO
const { addCustomPlaylist, updateCustomPlaylist, getCustomPlaylist } = useUserProfileStore()

const loadCustomPlaylist = () => {
    if (!props.id) return
    const id = props.id.trim()
    if (id.length < 1) return
    const playlist = getCustomPlaylist(id)
    if (!playlist) return
    const { title, about, cover } = playlist
    Object.assign(detail, { id })
    if (cover) Object.assign(detail, { cover })
    if (title) Object.assign(detail, { title })
    if (about) Object.assign(detail, { about })
}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = () => {
    let title = titleRef.value.value.trim()
    let about = aboutRef.value.value.trim()
    let cover = coverRef.value.src
    if (title.length < 1) {
        invalid.value = true
        return
    }
    let text = "歌单已创建成功!"
    if (!props.id) {
        addCustomPlaylist(title, about, cover)
    } else {
        updateCustomPlaylist(props.id, title, about, cover)
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
        const about = aboutRef.value.value.trim()
        const cover = result[0]
        Object.assign(detail, { title, about, cover })
    }
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
                        <input type="text" :value="detail.title" ref="titleRef" :class="{ invalid }" maxlength="25"
                            placeholder="请输入歌单名称，最多允许输入25个字符哦" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea :value="detail.about" ref="aboutRef" maxlength="520"
                            placeholder="你想用歌单诉说什么，一起分享一下吧~ 最多允许输入520个字符哦">
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
#custom-playlist-edit-view {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
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
    font-size: var(--text-main-title-size);
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
    /* border: 1px solid var(--main-left-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#custom-playlist-edit-view .center .cover-eidt-btn {
    background: var(--btn-bg);
    color: var(--svg-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
}


#custom-playlist-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#custom-playlist-edit-view .center .form-row {
    margin-bottom: 18px;
}

#custom-playlist-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#custom-playlist-edit-view .center .form-row span {
    font-size: 16px;
    color: var(--text-color);
    margin-bottom: 8px;
}

#custom-playlist-edit-view .center .form-row input,
#custom-playlist-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--input-border-color);
    outline: none;
    padding: 3px 6px;
    border-radius: 2px;
    background-color: var(--input-bg);
    color: var(--input-text-color);
    /*font-size: 15px; */
    font-size: var(--text-size);
}

#custom-playlist-edit-view .center .form-row input {
    height: 25px;
}

#custom-playlist-edit-view .center .form-row textarea {
    height: 300px;
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
    color: var(--hl-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#custom-playlist-edit-view .invalid {
    border-color: var(--error-color) !important;
    border-width: 3px;
}

#custom-playlist-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
</style>