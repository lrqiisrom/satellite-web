<template>
  <div class="satellite-app">
    <!-- Input Interface -->
    <SatelliteInput 
      v-if="!showSatelliteSystem" 
      @submit="handleSatelliteCountSubmit"
    />
    
    <!-- Satellite System Interface -->
    <SatelliteSystem 
      v-if="showSatelliteSystem" 
      :satellite-count="selectedSatelliteCount"
    />
    
    <!-- Back Button -->
    <button 
      v-if="showSatelliteSystem" 
      @click="goBack" 
      class="back-btn"
    >
      ← 返回设置
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SatelliteInput from './SatelliteInput.vue'
import SatelliteSystem from './SatelliteSystem.vue'

const showSatelliteSystem = ref(false)
const selectedSatelliteCount = ref(4)

const handleSatelliteCountSubmit = (count) => {
  selectedSatelliteCount.value = count
  showSatelliteSystem.value = true
}

const goBack = () => {
  showSatelliteSystem.value = false
}
</script>

<style scoped>
.satellite-app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.back-btn {
  position: fixed;
  top: 30px;
  left: 30px;
  z-index: 1000;
  padding: 12px 20px;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.back-btn:hover {
  background: rgba(31, 41, 55, 0.9);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.back-btn:active {
  transform: translateY(0);
}
</style>