const mpv = require('node-mpv')

let singleton = null
function createMpv(options, mpvArgs) {
    //退出
    try {
        if(singleton) {
            singleton.quit()
            singleton = null
        }
    } catch(error) {
        console.log(error)
    }
    //重启
    try {
        singleton = new mpv(options || {
            "binary": null,
            "verbose": false,
            "audio_only": true
        }, mpvArgs || [
            //"--fullscreen",
            "--fps=60"
        ])
    } catch(error) {
        console.log(error)
    }
    return singleton
}

module.exports = {
    createMpv
}