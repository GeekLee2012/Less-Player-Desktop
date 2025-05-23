export class Plugin {

    constructor({ id, name, version, about, repository, path, main, mainModule }) {
        const _now = Date.now()
        this.id = id
        this.name = name || `Plugin-${_now}`
        this.version = version || 'v1.0.0'
        this.about = about || ''
        this.repository = repository
        this.path = path
        this.main = main
        this.mainModule = mainModule
        this.type = 0   //0 => SF插件（single file）, 1 => Bundle插件
        this.state = 0
        this.created = _now
        this.updated = _now
    }

}