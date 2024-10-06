# <div align=center>Less Player</div>  

  
[![GitHub Release](https://img.shields.io/github/release/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/releases)
[![GitHub Tag](https://img.shields.io/github/tag/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/tags)
[![GitHub License](https://img.shields.io/github/license/GeekLee2012/Less-Player-Desktop)](https://github.com/GeekLee2012/Less-Player-Desktop/blob/main/LICENSE)
![GitHub Stars](https://img.shields.io/github/stars/GeekLee2012/Less-Player-Desktop)
![GitHub Forks](https://img.shields.io/github/forks/GeekLee2012/Less-Player-Desktop) 
![GitHub Downloads@Latest](https://img.shields.io/github/downloads/GeekLee2012/Less-Player-Desktop/latest/total)  
  
基于[Electron](https://www.electronjs.org/) + [Vue 3](https://vuejs.org/)开发、[插件化](https://github.com/GeekLee2012/Less-Player-Desktop-Plugins/)的播放器。   
  
<b>`郑重声明：`本项目仅供学习交流，请支持正版！若谁做非法用途，后果自负！</b>   
  
### 前言  
* 项目名字：源于Less is More（少即是多）
* 开发模式：循序渐进模式，边学习边开发（学以致用）  
* 项目初衷：抛砖引玉，一起学习交流，共同进步  
* 项目缺点：目前最大最明显的缺点，就是整体上缺乏架构思想，导致代码松散随意  
    
### 开发/测试环境
* OS：macOS Monterey（开发 + 测试）、Windows 10（虚拟机，仅测试）  
* IDE：[Visual Studio Code](https://code.visualstudio.com/)  
* [Nodejs](https://nodejs.org/)：>= 18.0.0  
* 其他：详见 [package.json](package.json)    
  
### 功能特性
* <b>插件扩展</b>：支持插件管理，可通过插件扩展播放器的内容、外观、功能等  
* <b>普通功能</b>：播放/暂停、上/下一首、进度条/播放时间、播放模式、音量控制、歌词等  
* <b>本地歌曲</b>：支持音频格式：mp3、flac、ogg、wav、aac、m4a; 支持导入歌单格式：m3u、pls 
* <b>自由FM</b>：支持新增/删除/修改FM广播电台；支持导入导出，格式包括：m3u、pls、json  
* <b>我的主页</b>：包括我的收藏、自定义歌单、关注的歌手、最近播放等  
* <b>动态频谱</b>：内置2种简单的频谱样式，支持插件扩展   
* <b>简单音效</b>：包括均衡器、混响等基本功能  
* <b>设置页</b>：包括主题、布局、窗口缩放、导航栏、快捷键、网络代理等  
* <b>播放页</b>：目前预设5种播放样式，“静动结合”; 歌词设置灵活，支持通过歌词调整歌曲进度、外文翻译（需平台支持） 
* <b>窗口缩放</b>：屏幕大小，适应自如  
* <b>桌面歌词</b>：支持横屏、竖屏歌词；支持3种显示模式，即单行、双行、全部；同时可对字体大小、颜色、行间距等进行设置   
    
### 预览图  
<!--
![Github snap 11.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2011.png)  
![Github snap 12.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2012.png)  
![Github snap 13.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2013.png)  
--> 
![Gitee snap 01.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2001.png)  
![Gitee snap 02.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2002.png)  
![Gitee snap 03.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/temp/snap%2003.png)  
   
### For开发者  
* 请先下载安装最新版（或最新LTS版本） [Nodejs](https://nodejs.org/)  

* <b>`若有问题，建议优先查看项目文档`</b>：[FAQ.md](FAQ.md) 
  
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
* 建议熟悉一下`播放器设置`，不同设置会带来一些些不同的使用体验  
* 适当`降低图片清晰度`，可有效`减少播放器内存占用`，请参考`“设置 - 通用 - 图片清晰度”`
* 播放器设置相对灵活，`部分功能默认“关闭”`，需前往“设置页”开启   
* `最新开发预览版（测试版）`，会在项目自身仓库，`不定期`打包发布，欢迎愿意尝鲜的朋友一起体验  
* 开发预览版，即为<b>`Pre-release`</b>版本，版本标题、tag标签名称、版本号里<b>`带有发布日期`</b>   
* 当前`页面顶部`，分别有<b>`release、tag、license、downloads`</b>等图标按钮，可点击<b>`release按钮`</b>直达`发行版本列表`页面  
* 任何删除`清空操作`（带垃圾桶图标的按钮）请`谨慎`！其实也没这么夸张，哈哈 ~  
* 为避免误操作，已部分支持对话框确认，请参考`“设置页 - 对话框”`  
    
### 发行版  
* 发行版：x64版本（二进制文件，如dmg、exe、zip等）；支持系统平台包括macOS、Windows 7+  
* Linux和x86平台：可下载源码，配置后构建打包，请参考 [常见问题 FAQ.md](FAQ.md)
  
### 项目相关文档
* 常见问题：[FAQ.md](FAQ.md)  
* 更新日志：[CHANGELOG.md](CHANGELOG.md) 
* 待办事项：[TODO.md](TODO.md)  
* LeVC格式：[LeVC.md](LeVC.md)  
  
### 其他  
* <b>`再次郑重声明：`本项目仅供学习交流，请支持正版！若谁做非法用途，后果自负！</b>