export class Theme {

    constructor(id, name) {
        /*基本信息*/
        this.id = id
        this.name = name
        this.desc = null
        this.author = null
        this.created = null
        this.updated = null
        /*应用背景*/
        this.appBackground = {
            bgColor: null,
            bgImage: [],
            //仅支持线性渐变
            bgImageGradient: {
                sideOrCorner: null,
                angle: null,
                colorStops: []
            }
        }

        /*内容*/
        this.content = {
            textColor: null,
            //titleTextColor: null,
            subtitleTextColor: null,
            secondaryTextColor: null,
            bgColor: null,
            highlightColor: null,
            headerBgColor: null,
            loadingMaskColor: null,
            listItemHoverBgColor: null
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
            iconTextBtnTextColor: null,
            iconTextBtnIconColor: null,
            iconTextBtnBgColor: null,
            iconTextBtnHoverBgColor: null,
            toggleBtnBgColor: null
        }

        /*搜索栏*/
        this.searchBar = {
            borderColor: null,
            bgColor: null,
            searchBtnBgColor: null,
            searchBtnIconColor: null,
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
            volumeBarThumbColor: null,
            checkboxBgColor: null
        }
    }

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

}