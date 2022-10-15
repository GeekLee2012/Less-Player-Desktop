## FAQ - 常见问题

### 一、开发环境相关
> 初始化项目失败：`npm install`时，发生错误。常见原因：  
1. 请尝试修改配置package.json中Electron、Electron Builder的版本  
【原因分析】这些版本对应的文件，在国内网络环境下，无法正常下载    
【解决】修改配置package.json中内容  
```
  "electron": "18.0.0"  
  "electron-builder": "22.14.13" 
```

2. 请尝试切换npm下载源：(如国内阿里镜像)  
【原因分析】国内网络环境不稳定，连接国外服务器容易超时  
```
npm config set registry http://registry.npmmirror.com
```     
恢复默认下载源命令  
```
npm config delete registry
```

3. 其他问题，请尝试以下命令  
  npm检查命令： `npm doctor`  
  npm安装时显示详细命令： `npm install --verbose`  
  npm配置查看命令： `npm config ls` 或 `npm config list`  
  
> 如何为Linux平台或x86平台编译打包  
* 修改配置package.json中内容  
  【方式1】  
  `script/dist: "electron-builder"`  
  在electron-builder命令后添加参数   
  【方式2】   
  `build/平台Code/target` 加入相关配置  
* 请参考官方文档：[Electron-Builder](https://www.electron.build/cli) 

### 二、其他
> 为何还要自己造轮子，Listen1、洛雪音乐助手不香吗？  
* 首先，二者使用体验都很香，但内容方面不太满意，目前都没有我喜欢的电台音乐分类  
* 其次，单纯想入门学习前端技术，可二者源码不太容易入门（就我当时的基础来说）  
* 再者，天时地利人和（作为后端开发者，却一直关注前端技术，刚好有时间、有机子、会网络爬虫等）  
* 总之，想造轮子不是一天两天三天啦，那就从播放器入手吧，我爱音乐啊  
  
> 如有其他问题，欢迎随时反馈、一起学习交流  