<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'UserInfoEditView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { ref, inject, reactive, onMounted } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { coverDefault, isBlank, toTrimString, isSupportedImage, ipcRendererInvoke } from '../../common/Utils';



const { backward } = inject('appRoute')

const props = defineProps({
    id: String
})

const { showToast, showFailToast } = useAppCommonStore()
const titleRef = ref(null)
//const coverRef = ref(null)
const invalid = ref(false)
const isActionDisabled = ref(false)
const setActionDisabled = (value) => isActionDisabled.value = value

const { user } = storeToRefs(useUserProfileStore())
const { updateUser } = useUserProfileStore()

const detail = reactive({ nickname: '', cover: '', about: '' })
const loadUserInfo = () => {
    const { nickname, cover, about, } = user.value
    Object.assign(detail, { nickname, cover, about })
}


const checkValid = () => {
    const title = titleRef.value.value
    invalid.value = isBlank(title)
}

const submit = () => {
    checkValid()
    if (invalid.value) {
        return
    }
    let { nickname, about, cover } = detail
    nickname = toTrimString(nickname)
    about = toTrimString(about)
    cover = toTrimString(cover)

    updateUser(nickname, about, cover)

    setActionDisabled(true)
    showToast("用户信息已更新")
    backward()
}

const setupCover = (cover) => {
    return Object.assign(detail, { cover })
}

//TODO 使用本地文件图片，不利于迁移共享
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
onMounted(() => loadUserInfo())
</script>

<template>
    <div id="user-info-edit-view" @drapover="(e) => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <span class="title">编辑用户信息</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="coverDefault(detail.cover)" />
                <div class="cover-eidt-btn" @click="updateCover">编辑头像</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>用户昵称</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.nickname" ref="titleRef" :class="{ invalid }" maxlength="64"
                            placeholder="请输入用户昵称，最多支持输入64个字符">
                    </div>
                </div>
                <div class="form-row">
                    <div><span>头像图片</span></div>
                    <div @keydown.stop="">
                        <input type="text" v-model="detail.cover" placeholder="头像图片URL，支持本地文件URL、在线URL" />
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介 / 说说</span></div>
                    <div @keydown.stop="">
                        <textarea v-model="detail.about" maxlength="512" placeholder="今天想要对自己说些什么呀~ 最多支持输入512个字符">
                        </textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="保存" :disabled="isActionDisabled">
                    </SvgTextButton>
                    <SvgTextButton :leftAction="() => backward()" text="取消" class="spacing" :disabled="isActionDisabled">
                    </SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#user-info-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#user-info-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
}

#user-info-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#user-info-edit-view .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#user-info-edit-view .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* border: 1px solid var(--border-left-nav-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#user-info-edit-view .center .cover-eidt-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    padding: 5px;
    border-radius: 3px;
    cursor: pointer;
}

#user-info-edit-view .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#user-info-edit-view .center .form-row {
    margin-bottom: 20px;
}

#user-info-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#user-info-edit-view .center .form-row span {
    font-size: var(--content-text-subtitle-size);
    color: var(--content-text-color);
    margin-bottom: 8px;
}

#user-info-edit-view .center .form-row input,
#user-info-edit-view .center .form-row textarea {
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

#user-info-edit-view .center .form-row input {
    height: 25px;
}

#user-info-edit-view .center .form-row textarea {
    /*height: 280px;*/
    height: 202px;
    padding: 8px;
}

#user-info-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#user-info-edit-view .spacing {
    margin-left: 20px;
}

#user-info-edit-view .required {
    color: var(--content-text-highlight-color) !important;
    font-weight: bold;
    font-size: 20px;
}

/*
#user-info-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}
*/

#user-info-edit-view .invalid {
    border-color: var(--content-error-color) !important;
    border-width: 3px;
}
</style>