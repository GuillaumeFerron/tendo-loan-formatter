<template>
  <main id="main" class="d-flex align-items-center justify-content-center h-full py-3">
    <ToolBody />
  </main>
</template>

<script setup>
import ToolBody from './components/common/ToolBody.vue'
</script>

<style lang="scss">
@import './scss/index.scss';

#main {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: url('./assets/bg.jpg') center;
  background-size: cover;
  min-height: 100vh;
}
</style>
