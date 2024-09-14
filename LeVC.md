### LeVC - Less Player Video Collection  

##### 一、阅读须知  
当前内容格式，不同环境可能会显示不同。
为避免产生误解，请在下列参考环境下阅读：
- 在Github上阅读，而国内Git平台在除Fireox外的其他浏览器中会显示错误 
- 在VSCode中，在预览模式（Preview Mode）下阅读  
- 使用第三方Markdown阅读器，在预览模式（Preview Mode）下阅读

##### 二、简介  
LeVC（Less Player Video Collection）即视频合集，文件扩展名为.levc。  

##### 三、格式规范（严格区分大小写）  
```text
$title$标题
$cover$图片URL
$year$年份
$region$地区
$lang$语言
$artists$演员
$tags$标签
$about$简介
$updated$更新时间
  
$list$
视频名称1$对应的URL
视频名称2$对应的URL
...
视频名称n$对应的URL
```

##### 四、格式说明  
* 内容严格`区分大小写`，如：`$Title$标题`将无法被识别为标题，正确格式应为`$title$标题`
* 目前格式分类有：`metadata项`、`数据项`、特殊格式、标记格式等
* metadata项，格式为`$key$value`
* 数据项，格式为`key$value`
* 特殊格式`$value$`，为 metadata项`$title$value`的`简写方式`
* 标记格式`$list$`，用作数据项的开始标记，为可选项
* metadata项，均为可选项，即可有可无
* metadata项，`对顺序无要求`：即任意两个metadata项，无先后顺序之分
* metadata项，`可重复`，但后项会`覆盖`前项内容
* 数据项，建议放在所有metadata项之后

##### 五、示例  
1、普通示例
```text
$电视剧$
第01集$https://abc.xyz/01
第02集$https://abc.xyz/02
```

2、重复metadata项的示例
```text
$title$我是电视剧
$我是动漫，我会覆盖上一行$
第01集$https://abc.xyz/01
第02集$https://abc.xyz/02
```