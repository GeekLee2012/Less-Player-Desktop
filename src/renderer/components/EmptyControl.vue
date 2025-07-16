<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingStore } from "../store/settingStore";
import { nextInt, shuffle } from "../../common/Utils";



const props = defineProps({
    text: String,
    marginTop: String,
})


const { isMikuLikeEmptyTipsShow } = storeToRefs(useSettingStore())

//语气
const oohs = ['咦！', '啊咧，', '纳尼？']
const computedText = computed(() => {
    shuffle(oohs)
    const index = nextInt(oohs.length)
    const defaultText = `${oohs[index]}这里竟空空如也 ~`
    return props.text || defaultText
})

const computedStyle = computed(() => {
    const { marginTop } = props
    let style = '' 
    if(marginTop) style += `margin-top: ${marginTop};`
    //if(marginBottom) style += `margin-bottom: ${marginBottom};`
    //if(marginLeft) style += `margin-left: ${marginLeft};`
    //if(marginRight) style += `margin-right: ${marginRight};`
    return style
})
</script>

<template>
    <div class="empty-ctl">
        <div class="wrap" v-show="isMikuLikeEmptyTipsShow">
            <img src="/miku.png" :style="computedStyle" />
            <div class="tip-text" v-html="computedText">
            </div>
        </div>
    </div>
</template>

<style scoped>
.empty-ctl {
    display: flex;
    justify-content: center;
    align-items: center;
}

.empty-ctl .wrap {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
}

.empty-ctl .wrap img {
    /*width: 142px;
    height: 191px;*/
    width: 36%;
    height: 36%;
    opacity: 0.33;
    margin-top: 88px;
    margin-bottom: 12px;
}

.empty-ctl .wrap img.reversed {
    transform: rotateY(-180deg);
}

.empty-ctl .wrap .tip-text {
    font-size: var(--content-text-size);
    opacity: 0.59;
}
</style>