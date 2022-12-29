<script setup>
import { ref } from 'vue';
import EventBus from '../../common/EventBus';



const props = defineProps({
    index: Number,
    id: String,
    text: String,
    checked: Boolean,
    isParent: Boolean,
    checkChangedFn: Function,
})

const isChecked = ref(props.checked)
const childrenShow = ref(false)

const toggleChildrenShow = () => {
    childrenShow.value = !childrenShow.value
}

const toggleChecked = () => {
    isChecked.value = !isChecked.value
    const { index, id, checkChangedFn } = props
    if (checkChangedFn) checkChangedFn(id, isChecked.value, index)
}

const setChecked = (id, checked) => {
    if (props.id != id) return
    isChecked.value = checked
}

EventBus.on("checkeboxTextItem-refresh", (data) => {
    const { id, checked } = data
    setChecked(id, checked)
})
</script>

<template>
    <div class="checkbox-text-item">
        <div class="item-wrap">
            <div class="checkbox" @click="toggleChecked">
                <svg v-show="!isChecked" width="16" height="16" viewBox="0 0 731.64 731.66"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                        </g>
                    </g>
                </svg>
                <svg v-show="isChecked" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                        </g>
                    </g>
                </svg>
            </div>
            <div class="action" v-show="isParent">
                <svg v-show="!childrenShow" class="expand-btn" @click="toggleChildrenShow" width="13" height="13"
                    viewBox="0 0 455.71 818.08" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <g id="Layer_2-2" data-name="Layer 2">
                                <g id="Layer_1-2-2" data-name="Layer 1-2">
                                    <path
                                        d="M354.54,413c-2.89-1.94-5-2.89-6.47-4.41Q181.42,241.85,14.81,75.08C1.75,62-3.43,46.91,2.34,29.08,11.92-.46,49.26-9.71,71.91,11.71c7.87,7.44,15.35,15.29,23,23L440.49,380.64c20.22,20.24,20.29,45.1.22,65.21Q262.27,624.5,83.9,803.2c-9.12,9.14-19.48,15.07-32.63,14.88-17.18-.25-30.24-8-37.94-23.27C5.54,779.38,7.14,764.15,17.22,750a61.07,61.07,0,0,1,6.7-7.4q162.34-162.55,324.74-325C349.94,416.3,351.53,415.32,354.54,413Z" />
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
                <svg v-show="childrenShow" class="collapse-btn" @click="toggleChildrenShow" width="13" height="13"
                    viewBox="0 0 763.32 424.57" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M380.47,322.11c27.6-27.5,54-53.68,80.23-80Q575,127.75,689.38,13.4C708.7-5.81,735-2.92,750.83,12.91c17,17,16.57,43.39-.9,60.87L414.1,409.61c-19.89,19.89-45,20-64.9.08Q180.9,241.45,12.66,73.15A42.53,42.53,0,1,1,72.85,13Q224.7,164.87,376.48,316.73A46.1,46.1,0,0,1,380.47,322.11Z" />
                        </g>
                    </g>
                </svg>
            </div>
            <slot name="prefix"></slot>
            <div v-html="text" @click="toggleChecked"></div>
            <slot name="suffix"></slot>
        </div>
        <div class="children-wrap" v-show="isParent && childrenShow">
            <slot name="children"></slot>
        </div>
    </div>
</template>

<style scoped>
.checkbox-text-item {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.checkbox-text-item .item-wrap {
    display: flex;
    flex-direction: row;
    height: 50px;
    align-items: center;
}

.checkbox-text-item .checkbox {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.checkbox-text-item .checkbox svg {
    margin-bottom: -2px;
    fill: var(--svg-color);
}

.checkbox-text-item .checkbox .checked-svg {
    fill: var(--hl-color) !important;
}

.checkbox-text-item .children-wrap {
    margin-left: 35px;
}

.checkbox-text-item .action {
    margin-right: 9px;
    margin-left: 1px;
}

.checkbox-text-item .action svg {
    fill: var(--svg-color);
}
</style>