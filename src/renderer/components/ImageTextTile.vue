<script setup>
const props = defineProps({
    cover: String,
    title: String,
    subtitle: String,
    playable: Boolean,
    playAction: Function
})

</script>

<template>
    <div class="image-text-tile">
        <div class="cover-wrap">
            <img class="cover" v-lazy="cover" /> 
            <div class="cover-mask">
                <div class="play-btn" v-show="playable" @click.stop="playAction">
                    <svg width="21" height="21" viewBox="0 0 139 139"  xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z"/></svg>
                </div>
            </div>
        </div>
        <!-- 目前体验不好
        <picture>
            <source type="image/webp" :srcset="cover">
            <img class="cover" v-lazy="cover" /> 
        </picture>
        -->
        <div class="title" v-html="title"></div>
        <div class="subtitle" v-show="subtitle" v-html="subtitle"></div>
    </div>
</template>

<style scoped>
.image-text-tile {
    margin: 15px 12px;
}

.image-text-tile .cover {
    width: 165px;
    height: 165px;
    line-height: 165px;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0px 0px 10px #161616;
    background-color: var(--text-color);
}

.image-text-tile .cover:hover {
    transform: scale(1.05) translateY(-4px);
}

.image-text-tile .title {
    width: 165px;
    margin-top: 5px;
    text-align: left;
    cursor: pointer;
    line-height: 21px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.image-text-tile .title:hover {
    background: linear-gradient(to right, #1ca388, #28c83f);
    background: var(--btn-bg);
    -webkit-background-clip: text;
    color: transparent;
}

.image-text-tile .subtitle {
    width: 165px;
    text-align: left;
    line-height: 25px;
    color: #989898;
    font-size: 14px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.image-text-tile svg {
    fill: var(--svg-color);
    cursor: pointer;
    -webkit-app-region: no-drag;
}

.image-text-tile .cover-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.image-text-tile .cover-wrap .cover-mask {
    position: absolute;
    margin: auto;
    z-index: 2;
    visibility: hidden;
}

.image-text-tile .cover-wrap:hover .cover-mask {
    visibility: visible;
}

.image-text-tile .cover-wrap .play-btn {
    border-radius: 10rem;
    width: 43px;
    height: 43px;
    background: linear-gradient(to top right, #28c83f, #1ca388);
    background: var(--btn-bg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.image-text-tile .cover-wrap .play-btn:hover {
    background: var(--btn-hover-bg);
}

.image-text-tile .cover-wrap .play-btn svg {
    margin-top: 1px;
    margin-left: 2px; 
    fill: var(--svg-btn-color) !important;
}
</style>