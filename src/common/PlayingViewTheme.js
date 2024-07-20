export class PlayingViewTheme {

    constructor(id, name, bgVideoUrl, previewCover, 
        fontName, fontSize, fontWeight, textColor, btnColor) {
        this.id = id
        //样式名称
        this.name = name
        this.type = 1   // 0 => 预设， 1 => 自定义
        this.dynamic = true //是否为动态视频背景样式主题
        //视频URL
        this.bgVideoUrl = bgVideoUrl 
        //预览图片URL
        this.previewCover = previewCover 
        //歌词
        this.fontName = fontName
        this.fontSize = fontSize || 80
        this.fontWeight = fontWeight || 600
        this.textColor = textColor
        //其他
        this.btnColor = btnColor
    }
}