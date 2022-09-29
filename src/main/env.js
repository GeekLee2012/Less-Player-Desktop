//环境配置，相关常量、变量等

//关闭警告提示
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//浏览器UserAgent
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0"
//支持的音频文件扩展名（本地文件）
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] 
//支持的图片文件扩展名（本地文件）
const IMAGE_EXTS = ['jpg', 'jpeg', 'png'] 
//是否为macOS
//是否为macOS
const isMacOS = (process.platform === 'darwin');
//是否使用自定义交通灯控件
const useCustomTrafficLight = !isMacOS;
//TODO 是否为开发环境, NODE_ENV取值：dev、proc
const isDevEnv = (process.env['NODE_ENV'] === 'dev');

//导出
module.exports = {
    isMacOS,
    useCustomTrafficLight,
    isDevEnv,
    USER_AGENT,
    AUDIO_EXTS,
    IMAGE_EXTS,
}
