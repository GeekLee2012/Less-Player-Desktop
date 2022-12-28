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
  background-color: var(--bg-color);
  background: var(--app-bg);
  background-position: center;
  background-size: cover;
  height: 100%;
  font-size: var(--text-size);
  color: var(--text-color);
  overflow: hidden;
}

#app {
  display: flex;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
