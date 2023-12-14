//Gesture 

//拖拽移动
//TODO 似是而非，暂且也归类于此吧
export const bindDragAndMove = (el, binding) => {
    if(!el || !binding || !binding.trigger) return
    
    const triggerEl = el.querySelector(binding.trigger)
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
