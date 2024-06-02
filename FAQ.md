## FAQ - 常见问题

### 一、开发环境相关  
> `npm install`或`npm run dist`时，发生错误  
  
【常见原因】  
国内网络环境不稳定，连接国外服务器容易超时。  
通常情况，都是因为无法下载Electron、Electron Builder等依赖，最终导致命令执行失败。  
  
【解决方式】  
在项目根目录下新增.npmrc配置文件，配置国内下载源镜像，内容如下（以国内阿里镜像为例）：  
```
registry=http://registry.npmmirror.com
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```
`（ 其实，将项目中的npmrc文件直接重命名为.npmrc即可 ）`  
  
----------------------------------------------------------------------------------  
  
  
> 常用命令  
  
| 描述 | 命令 |  
| :-  | :- |
| 设置registry下载源 |  npm config set registy http://registry.npmmirror.com  |
| 恢复默认下载源   | npm config delete registry |
| 配置查看        | npm config ls 或 npm config list |
| 检查诊断        | npm doctor |
| 安装时显示详情   | npm install --verbose |
| 更新依赖        | npm update |
|   |   | 
    
> 如何为Linux平台或x86平台编译打包  
  
* 修改配置[package.json](package.json)中内容  
  【配置点1】  
  `script/dist: "electron-builder"`  
  在electron-builder命令后添加参数   
  【配置点2】   
  `build/平台Code/target` 加入相关配置  
* 请参考官方文档：[Electron-Builder](https://www.electron.build/) 
  
----------------------------------------------------------------------------------  
  
    
### 二、其他  
> 为何还要自己造轮子，Listen1、洛雪音乐助手不香吗？  
* 首先，二者使用体验都很香，但内容方面不太满意，目前都没有我喜欢的电台（广播）  
* 其次，单纯想入门学习前端技术，可二者源码不太容易入门（就我当时的基础来说）  
* 再者，天时地利人和（作为后端开发者，却一直关注前端技术，刚好有时间、有机子、会点网络爬虫等）  
* 总之，想造轮子不是一天两天三天啦，那就从播放器入手吧，我爱音乐、电台（广播）啊  
* 最后，Less Player没有“音乐”两个字的限定哦，音乐只是其不可或缺的部分而已  
  
----------------------------------------------------------------------------------  
  
    
> 如有其他问题，欢迎随时反馈、一起学习交流  
