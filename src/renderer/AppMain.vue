<script setup>
import AppRoute from "./AppRoute.vue";
import PlayerBootstrap from "./PlayerBootstrap.vue";
import AppMainContent from "./AppMainContent.vue";
import APIExpose from "./APIExpose.vue";

</script>

<template>
  <AppRoute>
    <APIExpose>
      <PlayerBootstrap>
        <AppMainContent>
        </AppMainContent>
      </PlayerBootstrap>
    </APIExpose>
  </AppRoute>
</template>

<style>
</style>
