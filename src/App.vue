<template>
  <div id="app">
    <SatelliteApp />
  </div>
</template>

<script>
import SatelliteApp from './components/SatelliteApp.vue'

export default {
  name: 'App',
  components: {
    SatelliteApp
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
