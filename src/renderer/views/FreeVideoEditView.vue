<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'FreeVideoEditView'
}
</script>

<script setup>
import { ref, reactive, inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useVideoPlayStore } from '../store/videoPlayStore';
import { coverDefault, transformUrl, isSupportedVideo, toTrimString, md5, parseVideoCollectionLines, ipcRendererInvoke } from '../../common/Utils';
import { FILE_SCHEME } from '../../common/Constants';
import { storeToRefs } from 'pinia';



const { playVideo } = inject('player')
const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const { showToast, showFailToast } = useAppCommonStore()
const { queueVideosSize } = storeToRefs(useVideoPlayStore())
const { addVideo, playNextVideo, resetQueue } = useVideoPlayStore()

const coverRef = ref(null)
const detail = reactive({ title: '', url: '', streamType: 0, tags: '', about: '', cover: '' })
const setStreamType = (value) => Object.assign(detail, { streamType: value })
const titleInvalid = ref(false)
const urlInvalid = ref(false)
const isActionDisabled = ref(false)
const isCoverShow = ref(false)

const resetCheckStatus = () => {
    titleInvalid.value = false
    urlInvalid.value = false
}

const setupVideoUrl = (url) => Object.assign(detail, { url })

const playOne = (url) => {
    if(!url.startsWith('http') 
        && !url.startsWith('blob:http') 
        && !url.startsWith('/')) {
        urlInvalid.value = true
        return
    }
    //缺少协议时，默认指定为文件协议
    setupVideoUrl(transformUrl(url, FILE_SCHEME))

    let success = true, text = '即将为您播放视频'
    if (!success) return showFailToast('视频播放失败')
    
    backward()
    showToast(text, () => playVideo(detail))
}

const playCollection = (lines) => {
    if(!lines || !Array.isArray(lines) || lines.length < 1) return

    resetQueue()
    parseVideoCollectionLines(lines, addVideo)
    if(queueVideosSize.value < 1) return showFailToast('视频流URL无法解析')
    
    backward()
    showToast('即将为您播放视频合集', playNextVideo)
}

const submit = () => {
    resetCheckStatus()
    const { title, url, streamType, tags, about, cover } = detail
    //检查合法性
    if (!url || toTrimString(url).length < 10) {
        urlInvalid.value = true
        return
    }
    const lines = toTrimString(url).split('\n')
    if(!lines || lines.length < 1) return 
    lines.length > 1 ? playCollection(lines) : playOne(url)
}

const onDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer

    let isEventStopped = true
    if (files.length == 1) {
        const { path } = files[0]
        if (isSupportedVideo(path)) {
            setupVideoUrl(path)
        } 
    } else {
        //其他文件，直接放行，继续事件冒泡
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
}

//TODO
const updateCover = async () => {
    const result = await ipcRendererInvoke('open-image')
    if (result.length > 0) {
        const cover = result[0]
        Object.assign(detail, { cover })
    }
}
</script>

<template>
    <div id="free-video-edit-view" @dragover="(e) => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <span class="title" v-show="!id">创建Video播放源</span>
            <span class="title" v-show="id">编辑Video播放源</span>
        </div>
        <div class="center">
            <div v-show="isCoverShow">
                <img class="cover" v-lazy="coverDefault(detail.cover)" ref="coverRef" />
                <div class="cover-eidt-btn" @click="updateCover">编辑封面</div>
            </div>
            <div class="right" :class="{ 'no-cover': !isCoverShow }">
                <!--
                <div class="form-row">
                    <div>
                        <span>视频名称</span>
                        <span class="required" v-show="false"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.title" :class="{ invalid: titleInvalid }" maxlength="128"
                            placeholder="视频名称，最多支持输入128个字符" />
                    </div>
                </div>
                -->
                <div class="form-row">
                    <div v-show="false">
                        <span>URL</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <!--
                        <input type="text" v-model="detail.url" :class="{ invalid: urlInvalid }" maxlength="2048"
                            placeholder="视频流URL，仅支持file / http / https协议，最多支持输入2048个字符" />
                        -->
                        <textarea class="url-text" v-model="detail.url" :class="{ invalid: urlInvalid }" 
                            placeholder="视频流URL，支持file / http / https协议">
                        </textarea>
                    </div>
                </div>
                <!--
                <div class="form-row">
                    <div>
                        <span>视频流类型：</span>
                        <span v-for="(item, index) in ['默认Http Live Stream', '普通视频Live']" class="stream-type-item spacing"
                            :class="{ active: index == detail.streamType }" @click="setStreamType(index)">
                            {{ item }}
                        </span>
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
                            placeholder="标签，视频分类，用于搜索；多个标签时，以英文状态下的逗号(,)分隔" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea v-model="detail.about" maxlength="1024" placeholder="描述，最多支持输入1024个字符">
                        </textarea>
                    </div>
                </div>
                -->
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="开始播放" :disabled="isActionDisabled"></SvgTextButton>
                    <SvgTextButton :leftAction="backward" text="取消" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#free-video-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
}

#free-video-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
}

#free-video-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#free-video-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#free-video-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
    object-fit: contain;
}

#free-video-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
}


#free-video-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#free-video-edit-view .center .no-cover {
    margin-left: 0px;
}

#free-video-edit-view .center .form-row {
    margin-bottom: 25px;
}

#free-video-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
}

#free-video-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#free-video-edit-view .center .form-row input,
#free-video-edit-view .center .form-row textarea {
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

#free-video-edit-view .center .form-row input {
    height: 25px;
}

#free-video-edit-view .center .form-row textarea {
    height: 314px;
    padding: 8px;
}

#free-video-edit-view .center .form-row .stream-type-item {
    /*min-width: 136px;*/
    padding: 6px 15px;
    text-align: center;
    border-radius: 10rem;
    /*margin-right: 20px;*/
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#free-video-edit-view .center .form-row .stream-type-item:hover {
    background-color: var(--border-color);
    background-color: var(--content-list-item-hover-bg-color);
}

#free-video-edit-view .center .form-row .active {
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

#free-video-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#free-video-edit-view .spacing {
    margin-left: 20px;
}

#free-video-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#free-video-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}

/*
#free-video-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/
</style>