<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import ToggleControl from '../components/ToggleControl.vue';



const { toggleCustomThemeEditViewShow, hideCustomThemeEditView,
    toggleColorPickerToolbar } = useAppCommonStore()

</script>

<template>
    <div class="custom-theme-edit-view" v-gesture-dnm="{ trigger: '.header' }">
        <div class="container">
            <div class="header">
                <div class="action">
                    <svg @click="hideCustomThemeEditView" width="12" height="12" viewBox="0 0 593.14 593.11"
                        data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                            transform="translate(-663.4 -243.46)" />
                    </svg>
                </div>
                <div class="title-wrap">
                    <div class="title">自定义主题</div>
                </div>
            </div>
            <div class="center">
                <div class="row first">
                    <div class="cate-name">主题名称</div>
                    <input type="text" class="text-input-ctl" placeholder="主题名称" />
                </div>
                <div class="row" v-show="false">
                    <div class="cate-name">预览效果</div>
                    <ToggleControl id="toggle-ctl" @click="">
                    </ToggleControl>
                </div>
                <div class="row text-cates">
                    <div class="cate-name">文字内容</div>
                    <div class="row-content">
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">文字颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">高亮颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">副标题文字颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">次要文字<br>颜色</div>
                        </div>
                    </div>
                </div>
                <div class="row app-bg last">
                    <div class="cate-name">应用背景</div>
                    <div class="row-content">
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">背景颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">内容区<br>背景颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview"></div>
                            <div class="desc-text">标题性内容区背景颜色</div>
                        </div>
                        <div class="item" @click="toggleColorPickerToolbar">
                            <div class="color-preview">
                                <img v-show="false" />
                            </div>
                            <div class="desc-text">背景图片叠加渐变</div>
                        </div>
                        <div class="item img-item" @click="toggleColorPickerToolbar">
                            <div class="color-preview">
                                <img v-show="false" />
                                <svg class="add-custom-btn" @click="" width="28" height="28" viewBox="0 0 682.65 682.74"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <div class="desc-text">背景图片</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-theme-edit-view {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    border-radius: 15px;
    /*background: var(--seview-bg);*/
    -webkit-app-region: none;
}

.custom-theme-edit-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.custom-theme-edit-view .spacing {
    margin-left: 15px;
}

.custom-theme-edit-view .spacing1 {
    margin-left: 50px;
}

.custom-theme-edit-view .header,
.custom-theme-edit-view .center,
.custom-theme-edit-view .header .title-wrap,
.custom-theme-edit-view .center .bands {
    display: flex;
    flex-direction: row;
}

.custom-theme-edit-view .header {
    padding: 12px;
    border-bottom: var(--seview-border);
    background: var(--seview-bg);
    background: var(--content-bg-color);
}

.custom-theme-edit-view .header .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.custom-theme-edit-view .header .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.custom-theme-edit-view .header .action svg:hover {
    fill: var(--svg-hover-color);
}

.custom-theme-edit-view .header .title-wrap {
    margin-left: 20px;
    display: flex;
}

.custom-theme-edit-view .header .title {
    margin-right: 30px;
    font-size: var(--text-size);
}

.custom-theme-edit-view .header #toggle-ctl {
    cursor: default;
    -webkit-app-region: none;
}

.custom-theme-edit-view .center {
    padding: 0px 60px;
    flex: 1;
    background: var(--seview-bg);
    background: var(--content-bg-color);
    overflow: hidden;
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
}

.custom-theme-edit-view .center .first {
    padding-top: 33px;
}

.custom-theme-edit-view .center .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding-bottom: 36px;
}

.custom-theme-edit-view .center .last {
    margin-bottom: 88px;
}

.custom-theme-edit-view .center .row .text-input-ctl {
    width: 539px;
}

.custom-theme-edit-view .center .row .cate-name {
    font-size: var(--tab-title-text-size);
    width: 110px;
    text-align: left;
    margin-right: 10px;
    /*color: var(--text-sub-color);*/
}

.custom-theme-edit-view .center .row-content {
    display: flex;
    flex-direction: row;
    margin: 0px 3px 15px 3px;
    flex-wrap: wrap;
    align-items: flex-start;
    flex: 1;
}

.custom-theme-edit-view .center .row-content .item {
    font-size: var(--tip-text-size);
    width: 88px;
    margin-right: 52px;
    margin-bottom: 33px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
}

.custom-theme-edit-view .center .row-content .img-item {
    width: 202px;
}

.custom-theme-edit-view .center .row-content .color-preview {
    width: 68px;
    height: 68px;
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid var(--border-color);
    cursor: pointer;
}

.custom-theme-edit-view .center .row-content .img-item .color-preview {
    width: 202px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    fill: var(--text-sub-color);
}
</style>