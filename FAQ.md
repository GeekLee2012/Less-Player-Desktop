## FAQ - 常见问题

### 一、开发环境相关
> 初始化项目失败：`npm install`时，发生错误。常见原因：  
1. 请尝试修改配置package.json中Electron、Electron Builder的版本  
【原因分析】这些版本对应的文件，在国内网络环境下，无法正常下载  
【解决】修改配置package.json中内容  
  `"electron": ">= 18.0.0" 修改为"18.0.0"`  
  `"electron-builder": "^22.14.13" 修改为"22.14.13"`  

2. 请尝试切换npm下载源：(如国内阿里镜像)  
【原因分析】国内网络环境不稳定  
`npm config set registry http://registry.npmmirror.com`    
恢复默认下载源命令  
`npm config delete registry`

3. 其他问题：请尝试以下命令         
  npm检查命令： `npm doctor`  
  npm安装时显示详细命令： `npm install --verbose`
  
> 如何为Linux平台或x86平台编译打包  
* 修改配置package.json中内容  
  【方式1】  
  `script/dist: "electron-builder"`  
  在electron-builder命令后添加参数   
  【方式2】   
  `build/平台Code/target` 加入相关配置  
* 请参考官方文档：[Electron-Builder](https://www.electron.build/cli) 

### 二、其他
 > 如有其他问题，可随时交流和反馈
