<template>
  <div id="app">
    <SatelliteSystem />
  </div>
</template>

<script>
import SatelliteSystem from './components/SatelliteSystem.vue'

export default {
  name: 'App',
  components: {
    SatelliteSystem
  }
}
</script>

<style>
#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
}
</style>
