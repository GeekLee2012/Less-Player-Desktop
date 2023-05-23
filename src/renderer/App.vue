<script setup>
import AppRoute from "./AppRoute.vue";
import PlayerBoostrap from "./PlayerBoostrap.vue";
import AppContent from "./AppContent.vue";
</script>

<template>
  <AppRoute>
    <PlayerBoostrap>
      <AppContent></AppContent>
    </PlayerBoostrap>
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
  background-image: var(--app-bg-image);
  background-color: var(--app-bg-color);
  background-position: center;
  background-size: cover;
  display: flex;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
