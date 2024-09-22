<script setup>
import AppThemes from './AppThemes.vue';

</script>

<template>
  <AppThemes>
      <router-view v-slot="{ Component }">
        <component :is="Component">
        </component>
      </router-view>
  </AppThemes>
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
  border-radius: var(--border-app-win-border-radius);
}

#app {
  display: flex;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
