### LeVC

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
* 格式如：$xxx$yyy 为metadata项
* 格式如：xxx$yyy 为数据项
* metadata项，均为可选项，即可有可无
* metadata项，对顺序无要求，但尽量保证在数据项前

四、示例
```text
$title$电视剧
第01集$https://abc.xyz/01
第02集$https://abc.xyz/02
```

