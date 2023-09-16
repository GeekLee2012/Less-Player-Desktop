<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'FreeFMEditView'
}
</script>

<script setup>
import { onMounted, ref, reactive, inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useFreeFMStore } from '../store/freeFMStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useIpcRenderer } from '../../common/Utils';
import { FreeFM } from '../../vendor/freefm';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const ipcRenderer = useIpcRenderer()

const { showToast, showFailToast } = useAppCommonStore()
const coverRef = ref(null)
const detail = reactive({ title: null, url: null, streamType: 0, tags: null, about: null, cover: null })
const setStreamType = (value) => Object.assign(detail, { streamType: value })
const titleInvalid = ref(false)
const urlInvalid = ref(false)
const isActionDisabled = ref(false)


const { addFreeRadio, updateFreeRadio, getFreeRadio, removeFreeRadio } = useFreeFMStore()
const { removeFavoriteRadio } = useUserProfileStore()

const loadRadio = () => {
    if (!props.id) return
    const id = props.id.trim()
    if (id.length < 1) return
    const radio = getFreeRadio(id)
    if (!radio) return
    const { title, data, tags, about, cover } = radio
    Object.assign(detail, { id })
    if (cover) Object.assign(detail, { cover })
    if (tags) Object.assign(detail, { tags })
    if (title) Object.assign(detail, { title })
    if (about) Object.assign(detail, { about })
    if (data && data.length > 0) Object.assign(detail, { url: data[0].url, streamType: data[0].streamType })
}

const resetCheckStatus = () => {
    titleInvalid.value = false
    urlInvalid.value = false
}

const submit = () => {
    resetCheckStatus()
    const { title, url, streamType, tags, about, cover } = detail
    if (!title || title.length < 1) {
        titleInvalid.value = true
        return
    }
    if (!url || url.trim().length < 10 || !url.trim().startsWith('http')) {
        urlInvalid.value = true
        return
    }
    let success = false, text = null
    if (!props.id) {
        success = addFreeRadio(title, url, streamType, tags, about, cover)
        text = success ? '电台创建成功!' : '电台创建失败！<br>已存在相同URL的电台'
    } else {
        success = updateFreeRadio(props.id, title, url, streamType, tags, about, cover)
        text = success ? '电台已保存!' : '电台无法保存！<br>当前电台可能不存在'
    }
    if (success) {
        showToast(text, backward)
    } else {
        showFailToast(text)
    }
}

const remove = () => {
    const success = removeFreeRadio({ id: props.id })
    removeFavoriteRadio(props.id, FreeFM.CODE)
    if (success) {
        isActionDisabled.value = true
        showToast('电台已删除！', backward)
    } else {
        showFailToast('电台删除失败！')
    }
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

onMounted(() => loadRadio())

</script>

<template>
    <div id="freefm-edit-view">
        <div class="header">
            <span class="title" v-show="!id">创建FM电台</span>
            <span class="title" v-show="id">编辑FM电台</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="detail.cover" ref="coverRef" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>电台名称</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.title" :class="{ invalid: titleInvalid }" maxlength="128"
                            placeholder="电台名称，最多允许输入128个字符" />
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <span>URL</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.url" :class="{ invalid: urlInvalid }" maxlength="512"
                            placeholder="音频流URL，仅支持http / https协议，最多允许输入512个字符" />
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <span>音频流类型：</span>
                        <span v-for="(item, index) in ['默认Http Live Stream', '普通音频Live']" class="stream-type-item spacing"
                            :class="{ active: index == detail.streamType }" @click="setStreamType(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div class="tip-text">提示：音频类型，请根据具体URL格式或内容来选择。比如：<br>
                        https://xxxxxx.m3u8?q=xxx &nbsp;&nbsp;=> &nbsp;默认Http Live Stream<br>
                        https://xxxxxx.mp3?wd=xxx &nbsp;&nbsp;=> &nbsp;普通音频Live
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <span>封面URL</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.cover" placeholder="封面图片URL，支持本地文件URL、在线URL" />
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <span>标签</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.tags" maxlength="128"
                            placeholder="标签，电台分类，用于搜索；多个标签时，以英文状态下的逗号(,)分隔" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea v-model="detail.about" maxlength="1024" placeholder="描述，最多允许输入1024个字符">
                        </textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="保存" :disabled="isActionDisabled"></SvgTextButton>
                    <SvgTextButton :leftAction="remove" text="删除" v-show="id" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton :leftAction="backward" text="取消" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#freefm-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#freefm-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
}

#freefm-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#freefm-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#freefm-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
    object-fit: contain;
}

#freefm-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
}


#freefm-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#freefm-edit-view .center .form-row {
    margin-bottom: 25px;
}

#freefm-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
}

#freefm-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#freefm-edit-view .center .form-row input,
#freefm-edit-view .center .form-row textarea {
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

#freefm-edit-view .center .form-row input {
    height: 25px;
}

#freefm-edit-view .center .form-row textarea {
    height: 188px;
    padding: 8px;
}

#freefm-edit-view .center .form-row .stream-type-item {
    /*min-width: 136px;*/
    padding: 6px 15px;
    text-align: center;
    border-radius: 10rem;
    /*margin-right: 20px;*/
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#freefm-edit-view .center .form-row .stream-type-item:hover {
    background-color: var(--border-color);
    background-color: var(--content-list-item-hover-bg-color);
}

#freefm-edit-view .center .form-row .active {
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

#freefm-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#freefm-edit-view .spacing {
    margin-left: 20px;
}

#freefm-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#freefm-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

/*
#freefm-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>