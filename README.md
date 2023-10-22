# <div align=center>Less Player</div>  
  
[![GitHub release](https://img.shields.io/github/release/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/releases)
[![GitHub tag](https://img.shields.io/github/tag/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/tags)
[![GitHub license](https://img.shields.io/github/license/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/blob/main/LICENSE)
![GitHub Releases Download](https://img.shields.io/github/downloads/GeekLee2012/Less-Player-Desktop/total)  
    
  
一款基于Electron + Vue 3开发的播放器。   

<b>本项目正式长久停更！也可能永久停更！</b>
  
<b>`郑重声明：`本项目仅供学习交流，请支持正版！若谁做非法用途，后果自负！</b>   
  
### 前言  
* 项目名字：源于Less is More（少即是多）
* 开发模式：循序渐进模式，边学习边开发（学以致用）  
  
### 开发/测试环境
* OS：macOS Monterey（开发、测试）、Windows 10（虚拟机，仅测试）  
* IDE：[Visual Studio Code](https://code.visualstudio.com/)
* [Nodejs](https://nodejs.org/)：v16.17.0 LTS +  
* 其他：详见 [package.json](package.json)    
  
### 功能特性
* <b>普通功能</b>：播放/暂停、上/下一首、进度条/播放时间、播放模式、音量控制、歌词等 
* <b>支持主流平台</b>：QQ音乐、网易云、酷我、酷狗、豆瓣、云听等  
* <b>搜索</b>：支持在线主流平台、本地歌曲，而搜索类型包括歌曲、歌单、专辑、歌手等
* <b>内容多样</b>：覆盖音乐、MV、FM广播电台等；节奏有快有慢  
* <b>探索（浏览）模式</b>：分类歌单、万千歌手、相约电波  
* <b>本地歌曲</b>：支持音频格式，包括: mp3、flac、ogg、wav、aac、m4a; 支持导入歌单格式：m3u、pls 
* <b>自由FM</b>：支持新建/编辑FM广播电台；支持导入导出，格式包括: m3u、pls、json等  
* <b>我的主页</b>：包括我的收藏、自定义歌单、关注的歌手、最近播放等  
* <b>动态频谱</b>：目前支持3种简单的频谱样式  
* <b>简单音效</b>：包括均衡器、混响两大基本功能  
* <b>设置页</b>：包括主题、布局、窗口缩放、导航栏、快捷键、网络代理等  
* <b>播放页</b>：目前支持2种样式，“一静一动”; 歌词设置灵活，支持通过歌词调整歌曲进度、外文翻译（需平台支持） 
* <b>窗口缩放</b>：屏幕大小，适应自如  
* <b>桌面歌词</b>：支持横屏、竖屏歌词；支持3种显示模式，即单行、双行、全部；同时可对字体大小、颜色、行间距等进行设置 
  
PS  
*任何删除清空操作（带垃圾桶图标的按钮）请谨慎！其实也没这么夸张，哈哈 ~*  
*目前部分功能已支持确认，请参考播放器功能“设置页 - 对话框”*  
  
### 预览图  
![Github snap 11.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2011.png)  
![Github snap 12.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2012.png)  
![Github snap 13.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2013.png)  
  
![Gitee snap 01.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2001.png)  
![Gitee snap 02.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2002.png)  
![Gitee snap 03.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2003.png)  
   
### For开发者  
* 请先下载安装最新版（或最新LTS版本） [Nodejs](https://nodejs.org/)  

* <b>如有问题，建议先查看文档</b>：[FAQ.md](FAQ.md) 
  
* <b>安装依赖</b>  
  `npm install`
  
* <b>开发模式运行</b>  
  `npm run dev`
  
* <b>构建打包</b>  
  `npm run dist`  
      
  或者，分步执行  
  `npm run build`  
  `npm run pack`  
  
* <b>更新依赖</b>  
  `npm update`
  
### For普通用户
* 建议多熟悉一下，播放器设置功能，不同设置会带来一些些不同的使用体验哦
* 播放器设置相对灵活，部分功能会默认“关闭”，需前往“设置页”开启或切换
* 最新开发预览版（测试版），会在项目自身仓库，不定期打包发布，欢迎愿意尝鲜的朋友体验
* 当前顶部分别有release、tag、license、downloads等图标按钮，请点击<b>`release按钮`</b>直达发行版本列表页面
* 开发预览版，均为Pre-release版本，且tag标签名称以发布日期结尾
* 以下资源库，暂时不再使用（因为分开单独管理，并没有解决任何问题）：
* [Github资源库（废弃）](https://github.com/GeekLee2012/Resources/releases/)  
* [Gitee资源库（废弃）](https://gitee.com/rive08/resources/releases/)  
* PS: 变动带来的不便，请朋友们谅解！有时我也想做一些尝试，然而结果也并非总在预料之中
  
### 发行版  
* 发行版：x64版本（二进制文件，如dmg、exe、zip等）；支持系统平台包括macOS、Windows 7+  
* Linux和x86平台：可下载源码，配置后构建打包，请参考 [常见问题 FAQ.md](FAQ.md)
  
### 项目相关文档
* 常见问题：[FAQ.md](FAQ.md)  
* 更新日志：[CHANGELOG.md](CHANGELOG.md) 
* 待办事项：[TODO.md](TODO.md)  
  
### 其他  
* <b>`再次郑重声明：`本项目仅供学习交流，请支持正版！若谁做非法用途，后果自负！</b>