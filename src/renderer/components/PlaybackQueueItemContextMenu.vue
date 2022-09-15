<script setup>
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { onMounted, ref, watch } from 'vue';
import EventBus from '../../common/EventBus';
import { useUserProfileStore } from '../store/userProfileStore';

const { ctxMenuTrackItem } = storeToRefs(useMainViewStore())
const { showToast, hidePlaybackQueueItemCtxMenu } = useMainViewStore()
const { playTrack, addTrack, playTrackLater, removeTrack } = usePlayStore()
const { addFavouriteTrack } = useUserProfileStore() 

const props = defineProps({
    pos: Object
})

const playItem = () => {
    playTrack(ctxMenuTrackItem.value)
    hidePlaybackQueueItemCtxMenu()
}

const addItem = () => {
    addTrack(ctxMenuTrackItem.value)
    showToast("歌曲已添加成功！")
    hidePlaybackQueueItemCtxMenu()
}

const playItemLater = () => {
    playTrackLater(ctxMenuTrackItem.value)
    showToast("下一曲将为您播放！")
    hidePlaybackQueueItemCtxMenu()
}

const addFavouriteItem = () => {
    addFavouriteTrack(ctxMenuTrackItem.value)
    showToast("歌曲收藏成功！")
    hidePlaybackQueueItemCtxMenu()
}

//TODO
const router = useRouter()
const { exploreModeCode } = storeToRefs(useMainViewStore())

const { updateArtistDetailKeys } = useArtistDetailStore()
const { isArtistDetailVisitable } = usePlatformStore()

const visitArtistDetail = (platform, item, index) => {
    let id = item.id
    const platformValid = isArtistDetailVisitable(platform)
    let idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    platform = platform.trim()
    if(visitable) {
        const fromPath = router.currentRoute.value.path
        const toPath = '/' + exploreModeCode.value + '/artist/' + platform + "/" + id
        if(fromPath != toPath) {
            router.push(toPath)
            updateArtistDetailKeys(platform, id)
        }
    }
}

//TODO
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { isAlbumDetailVisitable } = usePlatformStore()

const visitAlbumDetail = (platform, id) => {
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid 
    platform = platform.trim()
    if(visitable) {
        const fromPath = router.currentRoute.value.path
        const toPath = '/' + exploreModeCode.value + '/album/' + platform + "/" + id
        if(fromPath != toPath) {
            router.push(toPath)
            updateAlbumDetailKeys(platform, id)
        }
    }
}

const visitItemArtist = ()=> {
    const { platform, artist } = ctxMenuTrackItem.value
    if(artist.length == 1) {
        visitArtistDetail(platform, artist[0])
        hidePlaybackQueueItemCtxMenu()
    }
}

const visitItemAlbum = ()=> {
    const { platform, album } = ctxMenuTrackItem.value
    visitAlbumDetail(platform, album.id)
    hidePlaybackQueueItemCtxMenu()
}

const removeItem = ()=> {
    removeTrack(ctxMenuTrackItem.value)
    hidePlaybackQueueItemCtxMenu()
}

const ctxMenuRef = ref(null)
/*
watch(playbackQueueItemCtxMenuShow, (ov, nv)=> {
    console.log(ctxMenuRef)
    console.log(ctxMenuRef.value.clientWidth)
    console.log(ctxMenuRef.value.clientHeight)
})
*/
</script>

<template>
    <div class="pbq-item-ctx-menu" :style="pos" @click.stop="" ref="ctxMenuRef">
        <div class="center">
            <div class="menuItem" @click="playItem">
                <div>
                    <svg width="16" height="16" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z"/></svg>
                </div>
                <div><span>播放</span></div>
            </div>
            <div class="menuItem" @click="playItemLater">
                <div>
                    <svg width="16" height="16" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z"/><path d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z"/></g></g></svg>
                </div>
                <div><span>下一曲播放</span></div>
            </div>
            <!--
            <div class="menuItem" @click="addItem">
                <div>
                    <svg width="16" height="16" viewBox="0 0 768.02 554.57" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z"/><path d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z"/><path d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z"/><path d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z"/></g></g></svg>
                </div>
                <div><span>添加到当前播放</span></div>
            </div>
            -->
            <div class="separator"></div>
            <div class="menuItem" @click="addFavouriteItem">
                <div>
                    <svg width="16" height="16" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z"/></g></g></svg>
                </div>
                <div><span>收藏</span></div>
            </div>
            <div class="menuItem">
                <div>
                    <svg width="16" height="16" viewBox="0 0 767.96 895.83" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M458.7,677.8,274.75,559.58c-35.29,34.33-77.25,51.15-126.42,47.61C104,604,67.35,584.86,38.16,551.38c-53.89-61.79-50.31-156.85,8.26-216.25,60.08-60.95,162.47-65.53,228.41.79L458.59,217.83c-17.32-49.24-14-96.72,13.09-141.57,19.67-32.52,47.82-55.37,83.9-67.49,75.65-25.39,155.7,5.8,193.1,74.7C785.34,151,768.21,236,708.87,284.05c-60.76,49.2-153.42,49.49-215.57-12.43l-184,118.25a161.11,161.11,0,0,1,0,115.78l184,118.23c64.15-64.7,163-61.37,223-6C774.44,671.56,785,760.17,740.5,825.46c-44.86,65.91-131.3,89-202.23,54.35C466.68,844.85,428.1,760.37,458.7,677.8ZM512,159.4a96,96,0,1,0,96.37-95.62A96.09,96.09,0,0,0,512,159.4Zm0,576a96,96,0,1,0,96.36-95.62A96.08,96.08,0,0,0,512,735.4ZM160.36,351.78A96,96,0,1,0,256,448.11,96,96,0,0,0,160.36,351.78Z"/></g></g></svg>
                </div>
                <div><span>分享</span></div>
            </div>
            <div class="separator"></div>
            <div class="menuItem" @click="visitItemArtist">
                <div>
                    <svg width="16" height="16" viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/><path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/><path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/></g></g></svg>
                </div>
                <div><span>查看歌手</span></div>
            </div>
            <div class="menuItem" @click="visitItemAlbum">
                <div>
                    <svg width="16" height="16" viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M426.8,0C662.36.12,853.54,191.36,853.47,426.8S662,853.64,426.67,853.5C191.13,853.35-.11,662.05,0,426.67.11,191.14,191.42-.12,426.8,0ZM85.5,426.47C85.26,615.09,238,767.94,426.71,768c188.49,0,341-152.31,341.26-341S615.52,85.53,426.76,85.5C238.23,85.47,85.75,237.82,85.5,426.47Z"/><path d="M426.46,256c-47.09,1-87.6,17.3-120.63,50.49-32.87,33-49,73.41-49.87,120.08H171.28c-3.29-136.12,114-257.59,255.18-255.36Z"/><path d="M512,426.48a85.66,85.66,0,1,1-85.11-85.83A85.42,85.42,0,0,1,512,426.48Z"/></g></g></svg>
                </div>
                <div><span>查看专辑</span></div>
            </div>
            <div class="separator"></div>
            <div class="menuItem" @click="removeItem">
                <div>
                    <svg width="16" height="16" class="spacing" viewBox="0 0 256 256" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><path d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z" transform="translate(-833 -413)"/><path d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z" transform="translate(-833 -413)"/><path d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z" transform="translate(-833 -413)"/><path d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z" transform="translate(-833 -413)"/></svg>
                </div>
                <div><span>删除</span></div>
            </div>
        </div>
    </div>
</template>

<style>
.pbq-item-ctx-menu {
    position: absolute;
    z-index: 101;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--ntf-bg);
    color: var(--);
    border-radius: 8px;
    padding: 15px 0px;
    border: 0.1px solid var(--border-color);
    box-shadow: 0px 0px 1px var(--ctx-menu-border-color);
}

.pbq-item-ctx-menu .menuItem {
    width: 139px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 14px;
    padding: 9px 20px;
}

.pbq-item-ctx-menu .menuItem:hover {
    background-color: var(--text-sub-color);
    background: var(--btn-bg);
    color: var(--svg-btn-color);
}

.pbq-item-ctx-menu .menuItem:hover svg {
    fill: var(--svg-btn-color);
}

.pbq-item-ctx-menu .menuItem > div {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.pbq-item-ctx-menu .menuItem svg {
    margin-right: 15px;
    fill: var(--text-color); 
}

.pbq-item-ctx-menu .separator {
    margin: 3px 15px;
    height: 0px;
    border-bottom: 0.36px solid var(--border-color);
}
</style>