<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'PluginDetailView'
}
</script>

<script setup>
import { inject, onActivated, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePluginStore } from '../store/pluginStore';
import { isBlank, toTrimString, textDefault, transformUrl } from '../../common/Utils';



const props = defineProps({
    id: String
})

const { visitLink } = inject('apiExpose')

const { getPlugin, updatePlugin } = usePluginStore()
const detail = reactive({ name: '', alias: '', author: '', version: '', repository: '', about: '' })

const loadPlugin = () => {
    const plugin = getPlugin(props.id)
    if (!plugin) return
    const { name, alias, author, version, repository, about } = plugin
    Object.assign(detail, { name, alias, author, version, repository, about })
}

const updateAlias = () => {
    const { id } = props
    let { alias } = detail
    alias = toTrimString(alias)
    updatePlugin({ id }, { alias })
}


/* 生命周期、监听 */
onActivated(loadPlugin)
</script>

<template>
    <div id="plugin-detail-view">
        <div class="header">
            <span class="title">插件详情</span>
        </div>
        <div class="center">
            <div class="info-wrap">
                <div class="name info-row">
                    <div class="sec-title">名称：</div>
                    <div class="sec-content" v-html="textDefault(detail.name, '未知')"></div>
                </div>
                <div class="alias info-row">
                    <div class="sec-title">备注：</div>
                    <input type="text" class="text-input-ctl" v-model="detail.alias"
                        placeholder="备注，最多支持128个字符，焦点离开输入框后自动保存" maxlength="128" @focusout="updateAlias" />
                    <div></div>
                </div>
                <div class="author info-row">
                    <div class="sec-title">作者：</div>
                    <div class="sec-content" v-html="textDefault(detail.author, '未知')"></div>
                </div>
                <div class="version info-row">
                    <div class="sec-title">版本：</div>
                    <div class="sec-content" v-html="textDefault(detail.version, '未知')"></div>
                </div>
                <div class="repository info-row">
                    <div class="sec-title">官网：</div>
                    <div class="sec-content">
                        <a href="#" class="no-link" :class="{ link: !isBlank(detail.repository) }"
                            @click.prevent="visitLink(detail.repository)" v-html="textDefault(detail.repository, '未知')"></a>
                    </div>
                </div>
                <div class="about info-row">
                    <div class="sec-title">简介：</div>
                    <div class="sec-content" v-html="textDefault(detail.about, '暂无')"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#plugin-detail-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#plugin-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#plugin-detail-view .header .title {
    text-align: left;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#plugin-detail-view .spacing {
    margin-right: 20px;
}

#plugin-detail-view .info-wrap {
    margin-left: 2px;
}

#plugin-detail-view .info-row {
    display: flex;
    margin-bottom: 20px;
    text-align: left;
}

#plugin-detail-view .info-row .sec-title {
    color: var(--content-subtitle-text-color);
    font-weight: bold;
    min-width: 66px;
    padding-top: 1px;
}

#plugin-detail-view .info-row .sec-content {
    overflow: hidden;
    word-wrap: break-word;
    /*white-space: pre-wrap;*/
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-height: var(--content-text-line-height);
}

#plugin-detail-view .info-row.name .sec-content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

#plugin-detail-view .info-row.alias .text-input-ctl {
    flex: 1;
    margin-right: 3px;
}

#plugin-detail-view .info-row.repository .sec-content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
}

#plugin-detail-view .info-row.about .sec-content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 10;
}
</style>