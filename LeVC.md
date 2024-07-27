### LeVC

`注意：当前内容请在预览模式（Preview Mode）下阅读，避免格式干扰而产生误解`

##### 一、简介
LeVC（Less Player Video Collection）即视频合集文件，扩展名为.levc。  

##### 二、格式规范（严格区分大小写）
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

##### 三、格式说明：
* 内容严格区分大小写
* 格式【$key$value】为metadata项
* metadata项，均为可选项，即可有可无
* metadata项，对顺序无要求：即任意两个metadata项，无先后顺序之分
* metadata项，可重复，但后项会覆盖前项内容
* 格式【key$value】为数据项
* 数据项，必须放在所有metadata项
* 格式【$value\$】为 metadata项【$title$value】的简写方式
* 格式【$list\$】，用作数据项的开始标记，为可选项

四、示例
1、普通示例
```text
$电视剧$
第01集$https://abc.xyz/01
第02集$https://abc.xyz/02
```

2、重复metadata项的示例
```text
$title$我是电视剧$
$我是动漫，我会覆盖上一行$
第01集$https://abc.xyz/01
第02集$https://abc.xyz/02
```