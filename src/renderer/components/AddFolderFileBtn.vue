<script setup>
const props = defineProps({
    disabled: Boolean
})
</script>

<template>
    <SvgTextButton class="add-folder-file-btn" text="添加文件夹" :disabled="disabled">
        <template #left-img>
            <svg width="17" height="15" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M18,2a2,2,0,0,1,2,2V14a2,2,0,0,1-2,2H2a2,2,0,0,1-2-2V2A2,2,0,0,1,2,0H9.41l2,2ZM2,2V14H18V4H10.59l-2-2Zm9,6h2a1,1,0,0,1,0,2H11v2a1,1,0,0,1-2,0V10H7A1,1,0,0,1,7,8H9V6a1,1,0,0,1,2,0Z" />
                    </g>
                </g>
            </svg>
        </template>
        <template #right-img>
            <svg width="15" height="17" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M2,0h9a1,1,0,0,1,.7.3l4,4A1,1,0,0,1,16,5V18a2,2,0,0,1-2,2H2a2,2,0,0,1-2-2V2A2,2,0,0,1,2,0Zm9,2.41V5h2.59ZM14,7H11A2,2,0,0,1,9,5V2H2V18H14ZM9,11h2a1,1,0,0,1,0,2H9v2a1,1,0,0,1-2,0V13H5a1,1,0,0,1,0-2H7V9A1,1,0,0,1,9,9Z" />
                    </g>
                </g>
            </svg>
        </template>
    </SvgTextButton>
</template>

<style></style>