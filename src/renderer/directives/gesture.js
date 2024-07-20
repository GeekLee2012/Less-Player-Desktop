//Gesture 
import { isSupportedVideo, isSupportedImage } from '../../common/Utils';

//拖拽移动
//TODO 似是而非，暂且也归类于此吧
export const bindDragAndMove = (el, binding) => {
    if(!el || !binding) return
    const { trigger: triggerSelector } = binding
    if(!triggerSelector) return 

    const triggerEl = el.querySelector(triggerSelector)
    if (!triggerEl) return

    triggerEl.onmousedown = (e1) => {
        let  { x, y } = e1

        document.onmousemove = (e2) => {
            const gx = e2.x - x
            const gy = e2.y - y
            x = e2.x
            y = e2.y

            const { clientWidth, clientHeight } = document.documentElement
            const { clientWidth: width, clientHeight: height, offsetLeft, offsetTop } = el

            let left = (offsetLeft + gx)
            let top = (offsetTop + gy)
            //边界检查
            left = Math.max(0, left)
            left = Math.min((clientWidth - width), left)
            top = Math.max(0, top)
            top = Math.min((clientHeight - height), top)

            Object.assign(el.style, {
                left: `${left}px`,
                top: `${top}px`
            })
        }

        document.onmouseup = () => {
            document.onmousemove = document.onmouseup = null
        }
    }
}

const isFunctionType = (fn) => (fn && typeof fn == 'function')

//拖放
export const bindDragAndDrop = (el, binding) => {
    if(!el || !binding) return
    const { onimage, onvideo, onfile, onerror } = binding

    el.ondragover = (event) => {
        event.preventDefault()
    }

    el.ondrog = (event) => {
        event.preventDefault()
        const { files } = event.dataTransfer
    
        if (files.length > 1) return isFunctionType(onerror) && onerror('NotAllowMultiDrop')
    
        const { path } = files[0]
        let isEventStopped = true
        if (isSupportedVideo(path)) {
            isFunctionType(onvideo) && onvideo(path)
        } else if (isSupportedImage(path)) {
            isFunctionType(onimage) && onimage(path)
        } else {
            //其他文件，直接放行，继续事件冒泡
            isFunctionType(onfile) && onfile(path)
            isEventStopped = false
        }
        if (isEventStopped) event.stopPropagation()
    }
}
