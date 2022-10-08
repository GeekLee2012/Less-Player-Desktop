## Less Player 是一款基于Electron + Vue3开发的音乐播放器  
### 欢迎喜欢GUI开发的朋友一起学习、交流和参与开发  
### 本项目仅供学习交流，禁止非法商业用途，请支持正版音乐  
  
#### 前言
* 本人为后端开发者，同时也比较爱好前端  
* 项目名字：源于Less is More（少即是多）
* 项目开发模式为渐进模式，边学习边开发（学以致用）  
  
#### 开发/测试环境
* OS：macOS Big Sur（开发、测试）、Windows 10（虚拟机，仅测试）  
* IDE：Visual Studio Code v1.71.0  
* Nodejs：v16.17.0 LTS  
* 其他：详见package.json  
  
#### 功能简介
* 播放器常见功能：播放/暂停、上/下一首、进度条/播放时间、播放模式、音量控制、歌词等   
* 支持在线音乐平台：QQ音乐、网易云音乐、酷我音乐、酷狗音乐、豆瓣FM  
* 支持在线广播平台：央广云听  
* 支持本地歌曲播放, 支持音频类型：mp3、flac、ogg、wav、aac、m4a  
* 支持2种探索（浏览）模式：歌单模式、歌手模式  
* 其他方面：设置、收藏、创建歌单、关注歌手、最近播放等  
  
*PS：目前所有操作暂无确认功能，任何删除清空操作（带垃圾桶图标的按钮）请谨慎！*  
  
#### 界面预览  
##### 预览图 
旧版（默认主题）  
![snap 01.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2008.png)  
![snap 02.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2009.png)  
![snap 03.png](https://github.com/GeekLee2012/Less-Player/blob/main/snapshot/snap%2010.png)  
    
新版（白色主题）  
![snap 04.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2004.png)  
![snap 05.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2005.png)  
![snap 06.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2006.png)  
![snap 07.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2007.png)  
![snap 08.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2008.png)  
![snap 09.png](https://gitee.com/rive08/resources/raw/master/less-player-desktop/snapshots/snap%2009.png)  
  
#### 开发者说  
* 请下载安装最新版Nodejs  
  
* 初始化项目  
  `npm install`
  
* 开发模式运行  
  `npm run dev`
  
* 编译打包  
  `npm run dist`  
      
  或分两个步骤执行
  `npm run build`  
  `npm run pack`  
    
  *请特别注意：此处的命令被重新规范，与之前版本同名，但功能截然不同！*  
  
#### 项目相关
* 常见问题：[FAQ.md](FAQ.md)  
* 更新日志：[CHANGELOG.md](CHANGELOG.md) 
* 待办事项：[TODO.md](TODO.md)  
  
#### 发行版  
* 发行版二进制文件均为：x64版本；支持系统平台包括macOS、Windows 7及其以上版本  
* Linux和x86平台：可下载源码，配置后编译打包，请参考 [常见问题 FAQ.md](FAQ.md)
  
#### 其他
* 项目中一些常用组件没做封装：如Tab组件、分页组件等  