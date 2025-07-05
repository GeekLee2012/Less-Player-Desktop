<template>
</template>

<style>
.none-electron {
  min-width: 1024px;
}

.none-electron #main-left .win-traffic-light-btn,
.none-electron .win-traffic-light-btn .ctl-btn,
.none-electron #default-main-top .win-non-macos-ctl-btn,
.none-electron .win-non-macos-ctl-btn .ctl-btn {
  display: none !important
}

.none-electron .win-non-macos-ctl-btn .collapse-btn {
  display: flex !important;
}

.none-electron #main-left .header {
  margin-bottom: 0px !important;
}

.none-electron #main-left .top-logo {
  margin-top: 20px !important;
}

.none-electron #setting-view input[type='range'],
.none-electron #setting-view #zoom-tickmarks {
  display: none;
}

.none-electron #local-music-view .aral-filter {
  width: 156px;
}
</style>
