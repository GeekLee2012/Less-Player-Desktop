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
            toast: false,
            //列表类
            contextMenu: false,
            playbackQueue: false,
            categoryView: false,
            playingThemeListView: false,
            //工具栏类
            soundEffectView: false,
            lyricToolbar: false,
            randomMusicToolbar: false,
            customThemeEditView: false,
            customPlayingThemeEditView: false,
            fontSelectionToolbar: false,
            trackResourceToolView: false,
            customAppBorderRadiusView: false
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
            inputsTextColor: null,
            //regularBgColor: null,
            //lightBgColor: null,
            //新增项
            listItemHlBgColor: null,
            listItemHlTextColor: null,
            imageTextTileCardBgColor: null,
            imageTextTileHCardBgColor: null,
            imageTextTileCardShadowColor1: null,
            imageTextTileCardShadowColor2: null,
        }

        /*边框*/
        this.border = {
            borderColor: null,
            headerNavBorderColor: null,
            leftNavBorderColor: null,
            bottomNavBorderColor: null,
            popoversBorderColor: null,
            inputsBorderColor: null
        }

        /*按钮*/
        this.button = {
            iconBtnColor: null,
            iconBtnHoverColor: null,
            iconTextBtnTextColor: null,
            iconTextBtnIconColor: null,
            iconTextBtnBgColor: null,
            iconTextBtnHoverBgColor: null,
            iconTextBtnBorderColor: null,
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
    
    setEntry(entry, key, value) {
        if(!entry || !key) return 
        Object.assign(entry, { [key]: value })
    }

    setAppBackground(key, value) {
        this.setEntry(this.appBackground, key, value)
    }

    setAppBackgroundScope(key, value) {
        this.setEntry(this.appBackgroundScope, key, value)
    }

    toggleAppBackgroundScope(key) {
        this.setAppBackgroundScope(key, !this.appBackgroundScope[key])
    }

    setContent(key, value) {
        this.setEntry(this.content, key, value)
    }

    setBorder(key, value) {
        this.setEntry(this.border, key, value)
    }

    setButton(key, value) {
        this.setEntry(this.button, key, value)
    }

    setSearchBar(key, value) {
        this.setEntry(this.searchBar, key, value)
    }

    setAppLogo(key, value) {
        this.setEntry(this.appLogo, key, value)
    }

    setOthers(key, value) {
        this.setEntry(this.others, key, value)
    }
}