## MPV
  
<b>`注意：`不同操作系统，支持的mpv版本不同</b> 
  
### 为什么需要配置mpv
* 在当前应用中，目前主要依赖Howler.js播放音频（Web Audio API）
* Howler.js支持大多数主流的音频格式，一般场景中表现都不错
* 而对于高品质的音频格式，Howler.js的不完善就显露出来，常常出现无法播放的情况
* mpv功能强大且完善，可解决上述高品质音频无法播放的问题，提供更好的音乐体验
* 喜欢本地播放、WebDAV、Emby、Jellyfin、Navidrome等的朋友们，建议配置mpv
  
### 简单了解mpv  
* mpv官网：https://mpv.io/  
* 吾爱破解帖子：  
https://www.52pojie.cn/thread-1916073-1-1.html

### mpv下载地址  
* 官方：https://mpv.io/installation/
* macOS版本（非官方下载渠道，仅供参考）：   
https://github.com/eko5624/mpv-macos-intel  
https://github.com/eko5624/mpv-mac
* Windows版本：https://sourceforge.net/projects/mpv-player-windows/files/
* Linux版本：暂缺  

### 在当前应用设置使用mpv
请参考 “设置 - 播放选项 - mpv binary可执行文件位置”

#### macOS
1. 下载当前系统对应版本的mpv.app  
2. 运行mpv.app，并给予相关的权限
3. 确保mpv.app能正常运行后，将mpv.app/Contents/MacOS/下的mpv文件、libs目录，复制到mpv.app外部、任意指定的目录  
（如：/Users/xxx/mpv binary/，其中xxx为用户名，mpv binary为自行创建的目录，名字可随意）
4. mpv binary可执行文件，则为该指定目录下的mpv文件（如：/Users/xxx/mpv binary/mpv）
  
#### Windows
1. 下载当前系统对应版本的mpv压缩包，并完成解压缩
2. mpv binary可执行文件，则为解压缩后的目录下的mpv.exe文件

#### Linux
* 暂缺