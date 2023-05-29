export class Theme {

    constructor(id, name) {
        /*基本信息*/
        this.id = id
        this.name = name
        this.desc = null
        this.author = null
        this.created = null
        this.updated = null
        this.previewBg = null //预览
        /*应用背景*/
        this.appBackground = {
            bgColor: null,
            bgImage: null,
            bgImageGradient: null //仅支持线性渐变
        }

        /*应用背景适用场景*/
        this.appBackgroundScope = {
            playingView: true,
            playbackQueue: false,
            categoryView: false,
            contextMenu: false,
            toast: false,
            soundEffectView: false,
            lyricToolbar: false,
            randomMusicToolbar: false
        }

        /*内容*/
        this.content = {
            textColor: null,
            textHighlightColor: null,
            highlightColor: null, //非文字类高亮，如图标、下边框等
            //titleTextColor: null,
            subtitleTextColor: null,
            secondaryTextColor: null, //次要文字颜色
            bgColor: null,
            headerNavBgColor: null,
            loadingMaskColor: null,
            listItemHoverBgColor: null,
            leftNavBgColor: null,
            inputsBgColor: null,
            inputsTextColor: null
        }

        /*边框*/
        this.border = {
            borderColor: null,
            leftNavBorderColor: null,
            popoversBorderColor: null,
            inputsBorderColor: null
        }

        /*按钮*/
        this.button = {
            iconBtnColor: null,
            //iconBtnHoverColor: null,
            iconTextBtnTextColor: null,
            iconTextBtnIconColor: null,
            iconTextBtnBgColor: null,
            iconTextBtnHoverBgColor: null,
            toggleBtnBgColor: null,
            toggleBtnThumbColor: null
        }

        /*搜索栏*/
        this.searchBar = {
            borderColor: null,
            bgColor: null,
            textColor: null,
            searchBtnBgColor: null,
            searchBtnHoverBgColor: null,
            searchBtnIconColor: null,
            searchBtnHoverIconColor: null,
            clearBtnIconColor: null
        }

        /*Logo*/
        this.appLogo = {
            bgColor: null,
            innerBgColor: null,
            innerTextColor: null,
            appNameTextColor: null
        }

        /*其他*/
        this.others = {
            scrollBarColor: null,
            progressBarBgColor: null,
            volumeBarThumbColor: null, //已废弃
            //checkboxBgColor: null
        }
    }

    /*
    static getAppBgImageLinearGradientText(theme) {
        if (!theme) return null
        const { appBackground } = theme
        if (!appBackground) return null
        const { bgImageGradient } = appBackground
        if (!bgImageGradient) return null
        const { sideOrCorner, angle, colorStops } = bgImageGradient
        if (!colorStops || colorStops.length < 1) return nulll
        const colors = colorStops.join(',')
        if (sideOrCorner) {
            return `linear-gradient(to ${sideOrCorner}, ${colors})`
        }
        if (angle) {
            return `linear-gradient(${angle}deg, ${colors})`
        }
        return `linear-gradient(${colors})`
    }
    */

}