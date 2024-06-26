//环境配置，相关常量、变量等

//关闭警告提示
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//浏览器UserAgent
const USER_AGENTS = [
    //KG音乐平台指定值，位置必须为第一个
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16) AppleWebKit/605.1.15 (KHTML, like Gecko)',

    //Safari
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4.1 Safari/605.1.15',

    //Firefox
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:106.0) Gecko/20100101 Firefox/106.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0',

    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',

    //Chrome
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',

    //Edge
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
]
//支持的音频文件扩展名（本地文件）
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
const EXTRA_AUDIO_EXTS = ['caf', 'oga', 'opus', 'weba', 'webm']
//支持的图片文件扩展名（本地文件）
const IMAGE_EXTS = ['jpg', 'jpeg', 'png']
//支持导入的歌单格式
const AUDIO_PLAYLIST_EXTS = ['m3u', 'm3u8', 'pls']
//支持备份的文件格式
const BACKUP_FILE_EXTS = ['json']
//是否为macOS
const isMacOS = (process.platform === 'darwin')
//是否为Windows OS
const isWinOS = (process.platform === 'win32')
//是否使用自定义交通灯控件
const useCustomTrafficLight = isMacOS
//TODO NODE_ENV取值：dev、proc
//是否为开发环境
const isDevEnv = (process.env['NODE_ENV'] === 'dev')
//应用Icon
const APP_ICON = isMacOS ? '../../public/icon.png' : '../../public/icon@2x.png'

const DOWNLOADS_PATH = (process.env['HOME'] || process.env['USERPROFILE']) + '/Downloads'

const TrayAction = {
    RESTORE: 0, //什么也不做，仅恢复上次显示
    PLAY: 1,
    PAUSE: 2,
    PLAY_PREV: 3,
    PLAY_NEXT: 4,
    USERHOME: 5,
    SETTING: 6,
    DESKTOP_LYRIC_OPEN: 7,
    DESKTOP_LYRIC_CLOSE: 8,
    DESKTOP_LYRIC_LOCK: 9,
    DESKTOP_LYRIC_UNLOCK: 10,
    DESKTOP_LYRIC_PIN: 11,
    DESKTOP_LYRIC_UNPIN: 12,
    PLUGINS: 20,
    CHECK_FOR_UPDATES: 99,
}

const GitRepository = {
    GITHUB: 'https://github.com/GeekLee2012/Less-Player-Desktop',
    GITEE: 'https://gitee.com/rive08/less-player-desktop'
}

//导出
module.exports = {
    isMacOS,
    isWinOS,
    useCustomTrafficLight,
    isDevEnv,
    USER_AGENTS,
    AUDIO_EXTS,
    EXTRA_AUDIO_EXTS,
    IMAGE_EXTS,
    AUDIO_PLAYLIST_EXTS,
    BACKUP_FILE_EXTS,
    APP_ICON,
    DOWNLOADS_PATH,
    TrayAction,
    GitRepository,
}
