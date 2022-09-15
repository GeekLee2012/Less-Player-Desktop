<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'CustomPlaylistEditView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated, ref, reactive, watch } from 'vue';
import { useMainViewStore } from '../store/mainViewStore';
import { useUserProfileStore } from '../store/userProfileStore';
import SvgTextButton from '../components/SvgTextButton.vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    id: String
})

const route = useRouter()
const { showToast } = useMainViewStore()
const titleRef = ref(null)
const descriptionRef = ref(null)
const coverRef = ref(null)
const invalid = ref(false)

//TODO
const { addCustomPlaylist, updateCustomPlaylist } = useUserProfileStore()

const loadCustomPlaylist = () => {
    if(!props.id) return 
    const id = props.id.trim()
    if(id.length < 1) return 

}

const checkValid = () => {
    let title = titleRef.value.value
    invalid.value = (!title || title.trim().length < 1)
}

const submit = () => {
    let title = titleRef.value.value.trim()
    let desc = descriptionRef.value.value.trim()
    let cover = coverRef.value.src
    if(title.length < 1) {
        invalid.value = true
        return 
    }
    let text = "歌单已创建成功!"
    if(!props.id) {
        addCustomPlaylist(title, desc, cover)
    } else {
        updateCustomPlaylist(props.id, title, desc, cover)
        text = "歌单已保存!"
    }
    showToast(text, () => route.push("/userhome"))
    
}

const cancel = () => {
    route.push("/userhome")
}

watch(() => props.id, (nv, ov) => loadCustomPlaylist())
</script>

<template>
    <div id="custom-playlist-edit">
        <div class="header">
            <span class="title" v-show="!id">创建歌单</span>
            <span class="title" v-show="id">编辑歌单</span>
        </div>
        <div class="center">
            <div>
                <img class="cover" v-lazy="" ref="coverRef"/>
                <div class="cover-eidt-btn">编辑封面</div>
            </div>
            <div class="right">
                <div class="form-row">
                    <div>
                        <span>歌单名</span>
                        <span class="required"> *</span>
                    </div>
                    <div @keydown.stop="">
                        <input type="text" ref="titleRef" :class="{ invalid }" @input="checkValid"  maxlength="20" placeholder="请输入歌单名称，最多允许输入25个字符哦">
                    </div>
                </div>
                <div class="form-row">
                    <div><span>简介</span></div>
                    <div @keydown.stop="">
                        <textarea ref="descriptionRef" placeholder="你想用歌单诉说什么，一起分享一下吧~ 最多允许输入1024个字符哦"></textarea>
                    </div>
                </div>
                <div class="action">
                    <SvgTextButton :leftAction="submit" text="保存"></SvgTextButton>
                    <SvgTextButton :leftAction="cancel" text="取消" class="spacing"></SvgTextButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#custom-playlist-edit {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: auto;
}

#custom-playlist-edit .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
}

#custom-playlist-edit .header .title {
    text-align: left;
    margin-top: 5px;
    font-size: 25px;
    font-weight: bold;
}

#custom-playlist-edit .center {
    display: flex;
    flex-direction: row;
    flex: 1;
}

#custom-playlist-edit .center .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    /* box-shadow: 0px 0px 10px #161616; */
}

#custom-playlist-edit .center .cover-eidt-btn {
    background-color: var(--main-left-border-color);
    padding: 5px;
    border-radius: 3px;
}


#custom-playlist-edit .center .right {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 20px;
}

#custom-playlist-edit .center .form-row {
    margin-bottom: 15px;
}

#custom-playlist-edit .center .form-row div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#custom-playlist-edit .center .form-row span {
    font-size: 16px;
    color: var(--text-color);
    margin-bottom: 8px;
}

#custom-playlist-edit .center .form-row input,
#custom-playlist-edit .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--main-left-border-color);
    outline: none;
    padding: 3px 6px;
    border-radius: 2px;
    background-color: var(--searchbar-bg);
    color: var(--searchbar-text-color);
    font-size: 15px;
}

#custom-playlist-edit .center .form-row input {
    height: 25px;
}

#custom-playlist-edit .center .form-row textarea {
    height: 256px;
    padding: 8px;
}

#custom-playlist-edit .center .action {
    display: flex;
    flex-direction: row;
}

#custom-playlist-edit .spacing {
    margin-left: 20px;
}

#custom-playlist-edit .required {
    color: var(--hl-color) !important;
    font-weight: bold;
    font-size: 20px;
}

#custom-playlist-edit .invalid {
    border-color: var(--error-color) !important;
    border-width: 3px;
}
</style>