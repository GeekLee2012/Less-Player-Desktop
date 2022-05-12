<script setup>
import { Track } from '../../common/Track';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';

const { addTrack, playTrack } = usePlayStore()

const props = defineProps({
    index: Number,
    artistVisitable: Boolean,
    albumVisitable: Boolean,
    data: Track,
    deleteFn: Function
})

const playItem = () => {
    playTrack(props.data)
}

const addItem = () => {
    addTrack(props.data)
}

const deleteItem = () => {
    if(props.deleteFn) {
        props.deleteFn(props.index)
    }
}
</script>

<template>
    <div class="playlist-item">
        <div class="sqno">{{ index + 1 }}</div>
        <div class="title spacing">
            <span v-html="data.title" ></span>
            <div class="action">
                <svg @click="playItem" width="18" height="18" class="play-btn" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z"/></svg>
                <svg @click="addItem" width="15" height="15" class="add-btn spacing" viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z"/></g></g></svg>
                <svg @click="deleteItem" width="16" height="16" class="delete-btn spacing" viewBox="0 0 256 256" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><path d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z" transform="translate(-833 -413)"/><path d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z" transform="translate(-833 -413)"/><path d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z" transform="translate(-833 -413)"/><path d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z" transform="translate(-833 -413)"/></svg>
            </div>
        </div>
        <div class="artist spacing1">
            <ArtistControl :visitable="artistVisitable"
                :platform="data.platform"
                :data="data.artist"
                :trackId="data.id" >
            </ArtistControl>
        </div>
        <div class="album spacing1">
            <AlbumControl :visitable="albumVisitable"
                :platform="data.platform"
                :data="data.album" >
            </AlbumControl>
        </div>
        <div class="duration spacing1">{{ data.mmssDuration() }}</div>
    </div>
</template>

<style scoped>
.playlist-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-bottom: 3px;
}

.playlist-item:hover {
    background-color: #464646;
}

.playlist-item > div {
    line-height: 50px;
    vertical-align: middle;
    font-size: 16px;
}

.playlist-item .spacing {
    margin-left: 12px;
}

.playlist-item .spacing1 {
    margin-left: 8px;
}

.playlist-item .title,
.playlist-item .artist,
.playlist-item .album {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
}

.playlist-item .artist span,
.playlist-item .album span {
    cursor: pointer;
}

.playlist-item .artist span:hover,
.playlist-item .album span:hover {
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}

.playlist-item .sqno {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.playlist-item .title {
    flex: 1;
    position: relative;
    text-align: left;
}

.playlist-item .title span {
    z-index: 1;
}

.playlist-item .artist {
    width: 25%;
}

.playlist-item .album {
    width: 25%;
}

.playlist-item .duration {
    width: 53px;
    padding-right: 8px;
    text-align: right;
}

.playlist-item .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    left: 158px;

    display: flex;
    align-items: center;

    padding-left: 10px;
    padding-right: 10px;
    
    background-color: #464646;
    visibility: hidden;
}

.playlist-item .action .delete-btn {
    visibility: hidden;
}

.playlist-item .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.playlist-item .action svg:hover {
    fill: #28c83f;
}

.playlist-item .title:hover .action {
    visibility: visible;
}

.playlist-item .title:hover span{
    width: 158px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}
</style>