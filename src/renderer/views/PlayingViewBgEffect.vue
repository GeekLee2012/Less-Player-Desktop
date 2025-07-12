<script setup>
import { inject, provide } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { stringPrefixEquals, nextInt, rgbToHsl, hslToRgb, grayscale, getPalette, shuffle } from '../../common/Utils';
import { Track } from '../../common/Track';
import { DEFAULT_COVER_BASE64 } from '../../common/Constants';



const props = defineProps({
    rootClass: String
}) 

const { applyDocumentStyle } = inject('appStyle')


const { currentTrack,loading } = storeToRefs(usePlayStore())
const { isCurrentTrack } = usePlayStore()
const { playingViewBgCoverEffectIndex, 
    playingViewBgCoverEffectGradientMode,
    playingViewBgCoverEffectGradientType,
    playingViewBgCoverEffectGradientBrightness,
    playingViewThemeColorIndex,
    playingViewBgCoverEffectGradientBottomBgTransparent,
} = storeToRefs(useSettingStore())


const getContainerEl = () => {
    const { rootClass } = props
    return document.querySelector(`.${rootClass} .container`)
}

const getCoverEl = (containerEl) => {
    const _containerEl = containerEl || getContainerEl()
    return _containerEl && _containerEl.querySelector('.center .cover')
}

const getLoadingBg = () => {
  const colors = shuffle(['#ff00007f', '#0000ff7f']).join(',')
  return `linear-gradient(${colors})`
}

const overrideDefaultPalette = (rgbs) => {
    const [r1, g1, b1] = rgbs[0]
    const [r2, g2, b2] = rgbs[1]
    const isHit = (r, g, b) => {
         //[219, 116, 115], [68, 68, 69]
        return (r == 219 && g == 116 && b == 115) 
            || (r == 68 && g == 68 && b == 69)
    }
    if(isHit(r1, g1, b1) && isHit(r2, g2, b2)) {
        //Noon to Dusk: #ff6e7f, #bfe9ff => [255, 110, 127], [191, 233, 255]
        //Love and Liberty: #200122, #6f0000 => [32, 1, 34], [111, 0, 0]
        //Poncho: #403a3e, #be5869 => [190, 88, 105], [64, 58, 62]
        return [[190, 88, 105], [64, 58, 62]]
    }
    return rgbs
}

const sortPalette = (rgbs, mode) => {
    //简单起见，仅考虑数组长度为2的情况
    const _rgbs = overrideDefaultPalette(rgbs.slice(0, 2))
    const [h1, s1, l1] = rgbToHsl(..._rgbs[0])
    const [h2, s2, l2] = rgbToHsl(..._rgbs[1])

    switch(mode) {
        case 0: //亮 -> 暗
            return l1 > l2 ? _rgbs : _rgbs.reverse()
        case 1: //暗 -> 亮
            return l1 > l2 ? _rgbs.reverse() : _rgbs
        default:
            break
    }
    return _rgbs
}

let isOptimizeEnable = false
const optimizePalette = (rgbs) => {
    if(!isOptimizeEnable) return rgbs
    //简单起见，仅考虑数组长度为2的情况
    const _rgbs = rgbs.slice(0, 2)
    //TODO 待学习色彩理论、算法
    return _rgbs.map(rgb => {
        return rgb
    })
}

const getPaletteAvgGrayscale = (rgbs) => {
    //简单起见，仅考虑数组长度为2的情况
    const _rgbs = rgbs.slice(0, 2)
    const sumGrayscale = _rgbs.reduce((accumulator, current) => {
        accumulator += grayscale(...current)
        return accumulator
    }, 0)
    return Math.round(sumGrayscale / _rgbs.length)
}

const getPlayingViewThemeAutoClass = (rgbs, defaultClass, grayscaleLimit) => {
    const limit = (grayscaleLimit >= 0 ? grayscaleLimit : 159)
    const avgGrayscale = rgbs ? getPaletteAvgGrayscale(rgbs) : (grayscaleLimit + 9)
    let autoClass = defaultClass || (avgGrayscale > limit ? 'dark' : 'light')
    switch(playingViewThemeColorIndex.value) {
        case 1:
            autoClass = 'light'
            break
        case 2:
            autoClass = 'dark'
            break
    }
    return autoClass
}

const setupGradientBackgroundEffect = (track) => {
    if(!isCurrentTrack(track)) return 
    const containerEl = getContainerEl()
    //if(!containerEl) return 
    const coverEl = getCoverEl(containerEl)
    //if(!coverEl) return 
    const isLoading = loading.value

    //backdrop-filter性能消耗非常大
    //macOS下，当歌曲频繁切换时，容易导致configd进程的CPU占用率飙升
    //加载时，暂时切换至简单渐变
    if(isLoading) {
        applyDocumentStyle({ 
            '--bg-effect': getLoadingBg(),
            '--bg-effect-bottom': 'transparent',
        })

        containerEl.classList.remove('light')
        containerEl.classList.remove('dark')
        containerEl.classList.remove('with-backdrop')
        containerEl.classList.remove('brightness-light')
        containerEl.classList.remove('brightness-mid')
    
        containerEl.classList.add('auto-effect')
        containerEl.classList.add('light')
        return 
    }

    //加载成功后，切换到正常封面效果
    const cover = Track.coverDefault(track)
    //默认封面
    if (stringPrefixEquals(DEFAULT_COVER_BASE64, cover, 128)) {
        containerEl.classList.remove('light')
        containerEl.classList.remove('dark')
        
        containerEl.classList.add('auto-effect')
        containerEl.classList.add('with-backdrop')
        containerEl.classList.add('default-cover')
        containerEl.classList.add('light')
        return 
    } 

    let bgEffect = 'none', bottomBg = 'transparent', rgbs = null

    const mode = playingViewBgCoverEffectGradientMode.value
    const bottomBgTransparent = playingViewBgCoverEffectGradientBottomBgTransparent.value
    const gradientType = playingViewBgCoverEffectGradientType.value

    const backdropClass = 'with-backdrop'
    const brightnessLightClass = 'brightness-light'
    const brightnessMidClass = 'brightness-mid'
    containerEl.classList.remove('light')
    containerEl.classList.remove('dark')
    containerEl.classList.remove(backdropClass)
    containerEl.classList.remove(brightnessLightClass)
    containerEl.classList.remove(brightnessMidClass)
    
    let autoClass = getPlayingViewThemeAutoClass(rgbs)
    containerEl.classList.add('auto-effect')
    containerEl.classList.add(autoClass)

    if(!bottomBgTransparent || gradientType == 1) {
        const alphaFactor = mode ? 88: 68
        rgbs = optimizePalette(sortPalette(getPalette(coverEl, 2), mode))
        if(!isCurrentTrack(track)) return 
        const alpha = (alphaFactor / 255).toFixed(2)
        const rgbColors = rgbs.map(([r, g, b]) =>(`rgb(${r}, ${g}, ${b})`))
        const rgbaColors = rgbs.map(([r, g, b]) =>(`rgba(${r}, ${g}, ${b}, ${alpha})`))
        const _rgbColors = rgbColors.join(',')
        bgEffect = `linear-gradient(${_rgbColors})`
        bottomBg = bottomBgTransparent ? 'transparent' : rgbaColors[0]
    }

    applyDocumentStyle({ 
        '--bg-effect': bgEffect,
        '--bg-effect-bottom': bottomBg,
    })
    if(!isCurrentTrack(track)) return 

    if(gradientType == 2 || (gradientType == 0 && (nextInt(100) % 2 == 0))) {
        containerEl.classList.add(backdropClass)
        //文字、按钮控件等元素，大部分在light样式下效果较好
        containerEl.classList.remove('dark')
        containerEl.classList.remove('light')
        autoClass = 'light'

        if(playingViewBgCoverEffectGradientBrightness.value == 0) {
            containerEl.classList.add(brightnessLightClass)
            autoClass = 'dark'
        } else if(playingViewBgCoverEffectGradientBrightness.value == 1) {
            containerEl.classList.add(brightnessMidClass)
        }

        containerEl.classList.add(getPlayingViewThemeAutoClass(rgbs, autoClass))
    }
    return true
}

let coverLoadCompletedListener = null
const clearBackgroundEffect = () => {
    const containerEl = getContainerEl()
    if(!containerEl) return 
    containerEl.classList.remove('simple-effect')
    containerEl.classList.remove('auto-effect')
    containerEl.classList.remove('with-backdrop')
    containerEl.classList.remove('brightness-light')
    containerEl.classList.remove('brightness-mid')
    containerEl.classList.remove('light')
    containerEl.classList.remove('dark')
    applyDocumentStyle({ '--bg-effect': 'none'})

    const coverEl = getCoverEl(containerEl)
    if(!coverEl) return
    if(coverLoadCompletedListener) {
        coverEl.removeEventListener('load', coverLoadCompletedListener)
    }
}

const setupCoverBackgroundEffect = async (track, onLoadCompleted) => {
    clearBackgroundEffect()
    if(!isCurrentTrack(track)) return 
    const containerEl = getContainerEl()
    if(!containerEl) return 
    const coverEl = getCoverEl(containerEl)
    if(!coverEl) return 
    if(typeof onLoadCompleted != 'function') return 
    coverLoadCompletedListener = async () => onLoadCompleted(track)
    if(coverEl.complete) coverLoadCompletedListener()
    coverEl.addEventListener('load', coverLoadCompletedListener)
}

const setupSimpleBackgroundEffect = async (track) => {
    if(!isCurrentTrack(track)) return 
    const containerEl = getContainerEl()
    if(!containerEl) return

    //加载时，切换到简单封面效果
    const isLoading = loading.value
    if (isLoading) {
        applyDocumentStyle({ '--bg-effect': getLoadingBg() })

        containerEl.classList.remove('light')
        containerEl.classList.remove('dark')

        containerEl.classList.add('auto-effect')
        containerEl.classList.add('simple-effect')
        containerEl.classList.add('light')
        return 
    }

    //加载成功后，切换到正常封面效果
    const cover = Track.coverDefault(track)
    applyDocumentStyle({ '--bg-effect': `url('${cover}')`})

    //默认封面
    if (stringPrefixEquals(DEFAULT_COVER_BASE64, cover, 128)) {
        containerEl.classList.remove('light')
        containerEl.classList.remove('dark')

        containerEl.classList.add('auto-effect')
        containerEl.classList.add('simple-effect')
        containerEl.classList.add('default-cover')
        containerEl.classList.add('light')
        return 
    } 

    const coverEl = getCoverEl(containerEl)
    const rgbs = optimizePalette(getPalette(coverEl, 2))
    if(!isCurrentTrack(track)) return 
    const autoClass = getPlayingViewThemeAutoClass(rgbs, null, 202)

    containerEl.classList.remove('light')
    containerEl.classList.remove('dark')

    containerEl.classList.add('auto-effect')
    containerEl.classList.add('simple-effect')
    containerEl.classList.add(autoClass)
}


const setupBackgroudEffect = async () => {
    switch(playingViewBgCoverEffectIndex.value) {
        case 0:
            clearBackgroundEffect()
            break
        case 1:
            setupCoverBackgroundEffect(currentTrack.value, setupSimpleBackgroundEffect)
            break
        case 2:
            setupCoverBackgroundEffect(currentTrack.value, setupGradientBackgroundEffect)
            break
        default:
            break
    }
}

provide('playingViewBgEffect', { 
    setupBackgroudEffect,
    clearBackgroundEffect
})
</script>

<template>
    <slot></slot>
</template>