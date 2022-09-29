## Less Player 是一款基于Electron + Vue3开发的音乐播放器  
### 欢迎喜欢GUI开发的朋友一起学习、交流和参与开发  
### 本项目仅供学习交流，禁止非法商业用途，请支持正版音乐  
  
### Git源码  
[https://gitee.com/rive08/less-player-desktop/](https://gitee.com/rive08/less-player-desktop/)  
[https://github.com/GeekLee2012/Less-Player-Desktop/](https://github.com/GeekLee2012/Less-Player-Desktop/)   
  
#### 前言
* 项目名字：源于Less is More（少即是多）  
* 项目口号Slogan：Less Player，Less is More ~ All for One, One for All ！（人人为我，我为人人~）  
  
#### 开发测试环境
* OS: macOS Big Sur、Windows 10（虚拟机）  
* IDE: Visual Studio Code v1.71.0  
* Nodejs: v16.17.0 LTS  
* 其他: 详见package.json  
  
#### 主要功能
* 播放器基本功能: 播放/暂停、上/下一首、进度条/播放时间、播放模式、音量控制等   
* 支持在线音乐平台：QQ音乐、网易云音乐、酷我音乐、酷狗音乐、豆瓣FM  
* 支持在线广播平台：央广云听  
* 支持本地歌曲播放, 支持音频类型: mp3、flac、ogg、wav、aac、m4a  
* 支持2种探索（浏览）模式：歌单模式、歌手模式  

*PS: 目前所有操作暂无确认功能，任何删除清空操作（带垃圾桶图标的按钮）请谨慎！！！*  
   
#### UI参考
* 目前部分UI参考借鉴腾讯QQ音乐Mac版  
* App Logo参考借鉴Dopamine  
  
#### 界面预览  
##### 预览图（Github）  
旧版（默认主题）  
![snap 01.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2008.png)  
![snap 02.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2009.png)  
![snap 03.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2010.png)   
    
##### 预览图（Gitee）   
新版（白色主题）  
![snap 04.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2004.png)  
![snap 05.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2005.png)  
![snap 06.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2006.png)  
![snap 07.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2007.png)  
![snap 08.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2008.png)  
![snap 09.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2009.png)  
  
#### 开发者说  
* 请预先安装好最新版Nodejs，官方下载地址  
[https://nodejs.org/en/download/](https://nodejs.org/en/download/)  
  
* 初始化项目  
  `npm install`
  
* 开发模式运行  
  `npm run dev`
  
* 编译打包  
  `npm run dist`  
      
  或分两个步骤，执行编译和打包  
  `npm run build`  
  `npm run pack`  
  *请特别注意：此处的命令被重新规范，与之前版本同名，但功能截然不同！！！告别手动删除编译打包历史目录的时代~*  

#### FAQ常见问题
请参考文件：[FAQ.md](FAQ.md)  
  
#### 项目进展  
想要了解一下，某功能是否已经实现？  
请参考文件：[TODO.md](TODO.md)  
更新日志：[CHANGELOG.md](CHANGELOG.md)   
  
#### 发行版  
* 由于Gitee平台附件总大小限制，仅最新发行版提供编译打包后的文件下载，其他发行版只提供源码  
* Github平台无限制，正常提供发行版本的全部相关文件  
* 发行版编译打包文件均为：x64版本；支持系统平台包括macOS、Windows 7及其以上版本  
* Linux和x86平台：可下载源码，配置后编译打包，请参考常见问题 [FAQ.md](FAQ.md)
  
#### 其他
* 本人为后端开发者，同时也比较爱好前端  
* 本项目开发为渐进模式，边学习边开发  
* 项目中一些常用组件没做封装: 如Tab组件、分页组件等  