<script setup>
import AppRoute from "./AppRoute.vue";
import PlayerBootstrap from "./PlayerBootstrap.vue";
import AppContent from "./AppContent.vue";
import APIExpose from "./APIExpose.vue";
</script>

<template>
  <AppRoute>
    <APIExpose>
      <PlayerBootstrap>
        <AppContent></AppContent>
      </PlayerBootstrap>
    </APIExpose>
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
