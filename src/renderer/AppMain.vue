<script setup>
import AppRoute from "./AppRoute.vue";
import PlayerBootstrap from "./PlayerBootstrap.vue";
import AppContent from "./AppContent.vue";
</script>

<template>
  <AppRoute>
    <PlayerBootstrap>
      <AppContent></AppContent>
    </PlayerBootstrap>
  </AppRoute>
</template>

<style>
html,
body,
#app {
  background: transparent;
  height: 100%;
  font-size: var(--content-text-size);
  color: var(--content-text-color);
  overflow: hidden;
  border-radius: var(--border-macstyle-border-radius);
}

#app {
  display: flex;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
