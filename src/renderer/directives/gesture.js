//Gesture 

//拖拽移动
//TODO 似是而非，暂且也归类于此吧
export const bindDragAndMove = (el, binding) => {
    const { trigger } = binding
    const triggerEl = el.querySelector(trigger)
    if (!triggerEl) return
    let x = 0, y = 0
    triggerEl.onmousedown = (e) => {
        x = e.x
        y = e.y
        document.onmousemove = (e) => {
            const gx = e.x - x
            const gy = e.y - y
            x = e.x
            y = e.y

            const width = el.clientWidth, height = el.clientHeight
            const { clientWidth, clientHeight } = document.documentElement
            //console.log("[ Gesture Directive ] ", width, ",",height)

            let left = (el.offsetLeft + gx)
            let top = (el.offsetTop + gy)
            //边界检查
            left = Math.max(0, left)
            left = Math.min((clientWidth - width), left)
            top = Math.max(0, top)
            top = Math.min((clientHeight - height), top)

            el.style.left = left + "px"
            el.style.top = top + "px"
        }
        document.onmouseup = () => {
            document.onmousemove = document.onmouseup = null
        }
    }
}
