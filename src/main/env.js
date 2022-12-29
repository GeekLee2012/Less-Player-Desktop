//环境配置，相关常量、变量等

//关闭警告提示
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//浏览器UserAgent
const USER_AGENTS = [
    //KG音乐平台指定值，位置必须为第一个
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16) AppleWebKit/605.1.15 (KHTML, like Gecko)',

    //Safari
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15',

    //Firefox
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:106.0) Gecko/20100101 Firefox/106.0',

    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',

    //Chrome
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',

    //Edge
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37'
]
//支持的音频文件扩展名（本地文件）
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
//支持的图片文件扩展名（本地文件）
const IMAGE_EXTS = ['jpg', 'jpeg', 'png']
//是否为macOS
const isMacOS = (process.platform === 'darwin')
//是否为Windows OS
const isWinOS = (process.platform === 'win32')
//是否使用自定义交通灯控件
const useCustomTrafficLight = !isMacOS || true
//TODO NODE_ENV取值：dev、proc
//是否为开发环境
const isDevEnv = (process.env['NODE_ENV'] === 'dev')
//应用Icon
const APP_ICON = isMacOS ? '../../public/icon.png' : '../../public/icon@2x.png'

//导出
module.exports = {
    isMacOS,
    isWinOS,
    useCustomTrafficLight,
    isDevEnv,
    USER_AGENTS,
    AUDIO_EXTS,
    IMAGE_EXTS,
    APP_ICON
}
