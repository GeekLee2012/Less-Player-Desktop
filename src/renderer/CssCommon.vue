<template>
</template>

<style>
:root {
  --scrollbar-width: 6px;
  --play-meta-height: 77px;
  --main-play-nav-height: 80px;
}

.btnDisabled {
    opacity: 0.33;
}

::-webkit-scrollbar {
  width: var(--scrollbar-width);
}

::-webkit-scrollbar-track {
  background: transparent;
}

.warning {
  fill: red !important;
  color: red !important;
}

/*TODO 试验性CSS */
/* fade-y */
.fade-y-enter-active,
.fade-y-leave-active {
    transition: all 0.3s ease;
}

.fade-y-enter-from,
.fade-y-leave-to {
    transform: translateY(-100%);
}

.fade-y-enter-to,
.fade-y-leave-from {
    transform: translateY(0);
}

/* fade-x */
.fade-x-enter-active,
.fade-x-leave-active {
  transition: all 0.5s ease-in-out;
}

.fade-x-enter-from,
.fade-x-leave-to {
    /*TODO*/
    transform: translateX(520px);
}

.fade-x-enter-to,
.fade-x-leave-from {
    transform: translateX(0);
}
</style>