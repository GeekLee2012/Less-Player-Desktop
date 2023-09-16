<script setup>
import Themes from './Themes.vue';
</script>

<template>
  <Themes>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </Themes>
</template>

<style>
html,
body,
#app {
  background: transparent;
  height: 100%;
  overflow: hidden;

  font-size: var(--content-text-size);
  color: var(--content-text-color);
  border-radius: var(--border-macstyle-border-radius);
}

#app {
  display: flex;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
