import { createApp } from 'vue';
import App from './App.vue';

//Pinia
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';
//Router
import { router } from './route/router';
//Lazy Load
import VueLazyLoad from 'vue3-lazyload';
//import lazyPlugin from 'vue3-lazy';
//播放器
import { createAudioPlayer } from '../common/Player';
import { createRadioPlayer } from '../common/RadioPlayer';
import { createVideoPlayer } from '../common/VideoPlayer';

//Components
import ProgressBar from './components/ProgressBar.vue';
import SliderBar from './components/SliderBar.vue';
import VolumeBar from './components/VolumeBar.vue';
import AudioTime from './components/AudioTime.vue';
import PlayControl from './components/PlayControl.vue';
import ImageTextTile from './components/ImageTextTile.vue';
import SongItem from './components/SongItem.vue';
import SvgTextButton from './components/SvgTextButton.vue';
//Views
//import PlayingView from './views/PlayingView.vue';
import VideoPlayingView from './views/VideoPlayingView.vue';
import PlaybackQueueView from './views/PlaybackQueueView.vue';
//Directives
import { bindDragAndMove } from './directives/gesture';
import { coverDefault } from '../common/Utils';


//状态管理
const pinia = createPinia().use(piniaPersist)

//播放器：创建
createAudioPlayer()
createRadioPlayer()
createVideoPlayer()

//应用：创建
const app = createApp(App)

//应用：配置全局异常处理器
app.config.errorHandler = (err, vm, info) => {
  // 处理错误
  // `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
  //暂时仅需捕获，以免程序崩溃，其他不用特别处理
  //console.log(err, vm, info)
}

//应用：配置插件、组件、指令等
app.use(pinia)
  .use(router)
  .use(VueLazyLoad, {
    loading: coverDefault(),
    error: coverDefault(),
    log: false,
    lifecycle: {
      error: (el) => {
        //此库有坑，还是巨坑，且停更已久
        //按上面简单的配置后，若图片加载失败时，会无限循环尝试加载图片......

        //看了源码，尝试hack一下，发现没起作用，保留下面一行代码，作为入口，备忘
        //const lazy = app.config.globalProperties.$Lazyload
      }
    }
  })
  //Components
  //自定义
  .component('SliderBar', SliderBar)
  .component('ProgressBar', ProgressBar)
  .component('VolumeBar', VolumeBar)
  .component('AudioTime', AudioTime)
  .component('PlayControl', PlayControl)
  .component('ImageTextTile', ImageTextTile)
  .component('SongItem', SongItem)
  .component('SvgTextButton', SvgTextButton)
  //Views
  //.component('PlayingView', PlayingView)
  .component('VideoPlayingView', VideoPlayingView)
  .component('PlaybackQueueView', PlaybackQueueView)
  //Directive
  .directive('gesture-dnm', (el, binding) => bindDragAndMove(el, binding.value))
  .mount('#app')