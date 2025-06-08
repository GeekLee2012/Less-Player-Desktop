<script>
//定义名称，方便用于<keep-alive>
export default { name: 'NavidromeSessionEditView' }
</script>

<script setup>
import { onMounted, ref, reactive, inject, computed } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useCloudStorageStore } from '../store/cloudStorageStore';
import { isBlank, toTrimString } from '../../common/Utils';
import { Navidrome } from '../../vendor/navidrome';



const props = defineProps({
    id: String
})

const { backward } = inject('appRoute')

const { showToast, showFailToast } = useAppCommonStore()
const detail = reactive({ title: '', url: '', username: '', password: '' })
const isActionDisabled = ref(false)
const setActionDisabled = (value) => isActionDisabled.value = value
const isCreateMode = !props.id


const { addNavidromeSession, updateNavidromeSession, getNavidromeSession,  } = useCloudStorageStore()


const loadSession = () => {
    if (isCreateMode) return

    const id = props.id.trim()
    if (id.length < 1) return
    const session = getNavidromeSession(id)
    if (!session) return
    const { title, url, username } = session
    Object.assign(detail, { id, title, url, username, password: '************' })
}


const submit = () => {
    for(const [key, value] of Object.entries(detail)) {
        if(isBlank(value) && !'title|url'.includes(key)) return showFailToast('字段信息不完整')
    }

    const { title, url, username, password } = detail
    let success = false
    if (isCreateMode) {
        const _title = isBlank(title) ? 'Navidrome' : title
        const _url = isBlank(url) ? Navidrome.DEFAULT_SESSION.url : url
        success = addNavidromeSession(_title, _url, username, password)
    } else {
        success = updateNavidromeSession(props.id, title, url, username)
    }
    if(!success) return showFailToast('会话保存失败')

    setActionDisabled(true)
    showToast('会话保存成功', backward)
    //backward()
}

const maskedUserName = computed(() => {
    const { username } = detail
    const _username = toTrimString(username)
    const { length } = _username
    if(length < 1) return _username
    const head = _username.substring(0, 1)
    const tail = _username.substring(length - 1, length)
    return `${head}********${tail}`
})

/* 生命周期、监听 */
onMounted(loadSession)
</script>

<template>
    <div id="navidrome-session-edit-view">
        <div class="header">
            <span class="title" v-show="!id">新建Navidrome会话</span>
            <span class="title" v-show="id">编辑Navidrome会话</span>
        </div>
        <div class="tip-text">提示：带*号为必填项；“用户名”、“密码”等信息，一旦创建，不支持更改</div>
        <div class="center">
            <div class="form-row">
                <div class="sec-title">会话名称：</div>
                <div @keydown.stop="">
                    <input type="text" v-model="detail.title" maxlength="128"
                        placeholder="会话名称，选填，缺省时为默认值，最多支持输入128个字符" />
                </div>
            </div>
            <div class="form-row">
                <div class="sec-title">会话URL：</div>
                <div @keydown.stop="">
                    <input type="text" v-model="detail.url" maxlength="1024"
                        placeholder="会话URL，选填，缺省时为默认值，最多支持输入1024个字符"  />
                </div>
            </div>
            <div class="form-row">
                <div class="sec-title">用户名*：</div>
                <div @keydown.stop="">
                    <input type="text" v-model="detail.username" maxlength="128"
                        placeholder="用户名，最多支持输入128个字符"
                        v-show="isCreateMode" />
                    <input type="text" v-show="!isCreateMode" 
                        :value="maskedUserName" readonly="true" />
                </div>
            </div>
            <div class="form-row">
                <div class="sec-title">密码*：</div>
                <div @keydown.stop="">
                    <input type="text" v-model="detail.password" maxlength="256"
                        placeholder="密码，最多支持输入256个字符"
                        :readonly="!isCreateMode" />
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
</template>

<style>
#navidrome-session-edit-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
}

#navidrome-session-edit-view .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
}

#navidrome-session-edit-view .header .title {
    text-align: left;
    margin-top: 5px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#navidrome-session-edit-view .center {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-top: 10px;
}

#navidrome-session-edit-view .tip-text {
    text-align: left;
    margin-bottom: 5px;
}

#navidrome-session-edit-view .center .form-row {
    margin-bottom: 17px;
    display: flex;
    flex-direction: row;
}

#navidrome-session-edit-view .center .form-row > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 9;
}

#navidrome-session-edit-view .center .form-row > div.sec-title {
    flex: 1;
    min-width: 100px;
}


#navidrome-session-edit-view .center .form-row input,
#navidrome-session-edit-view .center .form-row textarea {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    outline: none;
    padding: 5px 8px;
    border-radius: var(--border-inputs-border-radius);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    font-size: var(--content-text-size);
}

#navidrome-session-edit-view .center .form-row input {
    height: 28px;
}

#navidrome-session-edit-view .center .form-row textarea {
    height: 193px;
    padding: 8px;
}

#navidrome-session-edit-view .center .action {
    display: flex;
    flex-direction: row;
}

#navidrome-session-edit-view .spacing {
    margin-left: 20px;
}
</style>