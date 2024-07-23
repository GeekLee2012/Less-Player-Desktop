import EventBus from "./EventBus";


class EventBusWrapper {
    //注册监听 - 单个事件
    static onEvent(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    //发送消息
    static emitEvent(event, data) {
        EventBus.emit(event, data)
        return this
    }


    //注册监听 - 多个事件，以对象方式批量注册
    //链式编程，可使用多个onEvents()进行代码分类/分组管理
    static onEvents(registration) {
        if(!registration || typeof registration != 'object') {
            throw new Error('parameter type error: not a object')
        }
        Object.entries(registration).forEach(([event, handler]) => {
            if(!handler || typeof handler != 'function') return
            EventBusWrapper.onEvent(event, handler)
        })
        return this
    }

    /**
     * 发送消息
     * @param events 支持类型：string、string数组、object；
     * @param data 可选参数
     * @desc events为string数组时，将data发送给events数组里的多个元素；
     * events为object时，直接忽略data，对象属性为事件名称、属性值为消息内容，然后按属性顺序批量发送；
     */
    static emitEvents(events, data) {
        if(typeof events == 'string') {
            EventBusWrapper.emitEvent(events, data)
        } else if(Array.isArray(events)) {
            events.forEach(event => EventBusWrapper.emitEvent(event, data))
        } else if(typeof events == 'object') {
            Object.entries(events).forEach(([event, data]) => EventBusWrapper.emitEvent(event, data))
        } else {
            throw new Error('parameter "events" type invalid ')
        }
        return this
    }
}


function onEvents(registration) {
    return EventBusWrapper.onEvents(registration)
}

function emitEvents(events, data) {
    return EventBusWrapper.emitEvents(events, data)
}

export { onEvents, emitEvents }