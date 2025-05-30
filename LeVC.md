### LeVC - Less Player Video Collection  

##### 一、阅读须知  
当前内容格式，不同环境可能会显示不同。
为避免产生误解，请在下列参考环境下阅读：
- Github上，在预览模式（Preview Mode）下阅读
- VSCode中，在预览模式下阅读  
- 第三方Markdown阅读器，在预览模式下阅读  
- （不建议）国内Git平台上，在预览模式下阅读；但在部分浏览器中，可能会显示错误  
  
##### 二、简介   
LeVC（Less Player Video Collection）即视频合集，文件扩展名为.levc。  
LeVC格式，并非为追求高效、简洁等方面目的，而是为适配某些资源的使用场景。  

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
* 内容按行读取，即分隔符为（回车）换行符
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

3、无metadata项的示例
```text
视频$https://xyz.abc/01
动漫$https://abc.xyz/01
```

4、纯url的示例
```text
https://xyz.abc/01
https://xyz.abc/02
```

##### 其他
```text
视频 = 动态画面 + 音频 + 其他
视频合集 => 音频合集  
```