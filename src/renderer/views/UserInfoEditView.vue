<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'UserInfoEditView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { ref, inject } from 'vue';
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

//TODO
const { user } = storeToRefs(useUserProfileStore())
const { updateUser } = useUserProfileStore()

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = () => {
    let nickname = titleRef.value.value.trim()
    let about = aboutRef.value.value.trim()
    let cover = coverRef.value.src
    checkValid()
    if (invalid.value) {
        return
    }
    updateUser(nickname, about, cover)
    showToast("用户信息已更新", backward)
}

//TODO 使用本地文件图片，不利于迁移共享
const updateCover = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-image')
    if (result.length > 0) {
        coverRef.value.src = result[0]
    }
}
</script>

<template>
    <div id="user-info-edit-view">
        <div class="header">
            <span class="title">编辑用户信息</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="user.cover" ref="coverRef" />
                <div class="cover-eidt-btn" @click="updateCover">编辑头像</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>用户昵称</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" :value="user.nickname" ref="titleRef" :class="{ invalid }" maxlength="20"
                            placeholder="请输入用户昵称，最多允许输入20个字符哦">
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介 / 说说</span></div>
                    <div @keydown.stop="">
                        <textarea :value="user.about" ref="aboutRef" maxlength="99"
                            placeholder="今天想要对自己说些什么呀~ 最多允许输入99个字符哦"></textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="保存"></SvgTextButton>
                    <SvgTextButton :leftAction="() => backward()" text="取消" class="spacing"></SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#user-info-edit-view {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
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
    font-size: var(--text-main-title-size);
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
    /* border: 1px solid var(--main-left-border-color); */
    box-shadow: 0px 0px 1px #161616;
}

#user-info-edit-view .center .cover-eidt-btn {
    background: var(--btn-bg);
    color: var(--svg-text-color);
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
    margin-bottom: 18px;
}

#user-info-edit-view .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#user-info-edit-view .center .form-row span {
    /*font-size: 16px;*/
    color: var(--text-color);
    margin-bottom: 8px;
}

#user-info-edit-view .center .form-row input,
#user-info-edit-view .center .form-row textarea {
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

#user-info-edit-view .center .form-row input {
    height: 25px;
}

#user-info-edit-view .center .form-row textarea {
    height: 300px;
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
    color: var(--hl-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#user-info-edit-view ::-webkit-input-placeholder {
    color: var(--input-placeholder-color);
}

#user-info-edit-view .invalid {
    border-color: var(--error-color) !important;
    border-width: 3px;
}
</style>