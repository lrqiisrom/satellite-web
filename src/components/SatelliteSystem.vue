<template>
  <div class="satellite-system">
    <!-- Starry background -->
    <div class="starry-background">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
    </div>
    
    <!-- Main container -->
    <div class="system-container">
      <!-- Earth in the center -->
      <div class="earth-container">
        <img class="earth-img" src="@/assets/earth.jpg" alt="Earth" />
      </div>
      
      <!-- Communication lines between satellites only -->
      <div class="communication-lines">
        <div
          v-for="[i, j] in satelliteLinePairs"
          :key="'full-line-' + i + '-' + j"
          class="comm-line"
          :style="getLineStyle(i, j)"
        ></div>
      </div>
      
      <!-- Satellites -->
      <div 
        v-for="(satellite, index) in satellites" 
        :key="index"
        :ref="el => satelliteRefs[index] = el"
        class="satellite"
        :style="{ left: satellite.x + 'px', top: satellite.y + 'px' }"
        @click="showContextMenu($event, index)"
      >
        <img
          :src="require('../assets/satellite.jpg')"
          alt="卫星"
          class="satellite-img"
          style="width: 80px; height: 80px; transform: translate(-50%, -50%); position: absolute; left: 50%; top: 50%; cursor: pointer; transition: left 0.5s, top 0.5s; z-index: 11;"
        />
      </div>
      
      <!-- Context Menu -->
      <div 
        v-if="contextMenu.visible" 
        class="context-menu"
        :style="{ 
          left: contextMenu.x + 'px', 
          top: contextMenu.y + 'px',
          transform: contextMenu.transform
        }"
        @click.stop
      >
        <div class="menu-arrow" :class="contextMenu.arrowPosition"></div>
        <div class="menu-items">
          <button 
            v-for="item in menuItems" 
            :key="item"
            class="menu-item"
            @click="handleMenuClick(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Click outside to close menu -->
    <div 
      v-if="contextMenu.visible" 
      class="overlay"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const satelliteRefs = ref([])

const earthCenter = { x: 300, y: 300 } // system-container中心
const satelliteRadius = 220
const satelliteCount = 4

const satellites = ref(Array.from({ length: satelliteCount }, (_, i) => {
  const angle = (2 * Math.PI / satelliteCount) * i - Math.PI / 4 // 使第一个卫星在正上方
  const radius = (i === 2 || i === 3) ? 270 : satelliteRadius;
  return {
    position: ['top', 'right', 'bottom', 'left'][i],
    x: earthCenter.x + radius * Math.cos(angle),
    y: earthCenter.y + radius * Math.sin(angle)
  }
}))

const satelliteLinePairs = computed(() => {
  const pairs = [];
  for (let i = 0; i < satellites.value.length; i++) {
    for (let j = i + 1; j < satellites.value.length; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
});

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  transform: '',
  arrowPosition: 'bottom',
  satelliteIndex: -1
})

const menuItems = ref(['test1', 'test2', 'test3'])

const getLineStyle = (fromIndex, toIndex) => {
  const from = satellites.value[fromIndex]
  const to = satellites.value[toIndex]
  // 卫星中心点坐标（图片80x80，中心点+40,+40）
  const fromCenterX = from.x + 40;
  const fromCenterY = from.y + 40;
  const toCenterX = to.x + 40;
  const toCenterY = to.y + 40;
  const deltaX = toCenterX - fromCenterX
  const deltaY = toCenterY - fromCenterY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
  return {
    position: 'absolute',
    left: fromCenterX + 'px',
    top: fromCenterY + 'px',
    width: distance + 'px',
    height: '2px',
    transformOrigin: '0 50%',
    transform: `rotate(${angle}deg)`,
    background: 'none',
    borderTop: '2px dashed #FFFFFF',
    zIndex: 10
  }
}

const showContextMenu = (event, index) => {
  event.stopPropagation()
  const satellite = satellites.value[index]
  let menuX = satellite.x + 70
  let menuY = satellite.y + 20
  let transform = ''
  let arrowPos = 'left'
  if (satellite.position === 'top') {
    menuX = satellite.x + 10
    menuY = satellite.y + 50
    arrowPos = 'top'
  } else if (satellite.position === 'right') {
    menuX = satellite.x - 110
    menuY = satellite.y + 5
    arrowPos = 'right'
  } else if (satellite.position === 'bottom') {
    menuX = satellite.x + 10
    menuY = satellite.y - 90
    arrowPos = 'bottom'
  } else if (satellite.position === 'left') {
    menuX = satellite.x + 70
    menuY = satellite.y + 5
    arrowPos = 'left'
  }
  contextMenu.value = {
    visible: true,
    x: menuX,
    y: menuY,
    transform: transform,
    arrowPosition: arrowPos,
    satelliteIndex: index
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const handleMenuClick = (item) => {
  console.log(`执行 ${item} 功能，卫星编号: ${contextMenu.value.satelliteIndex + 1}`)
  alert(`执行 ${item} 功能，卫星编号: ${contextMenu.value.satelliteIndex + 1}`)
  closeContextMenu()
}

const handleClickOutside = () => {
  closeContextMenu()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.comm-line {
  animation: commBlink 2s ease-in-out infinite;
}

@keyframes commBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.satellite-system {
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

/* Starry Background */
.starry-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 50s linear infinite;
}

.stars:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
    radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
  background-repeat: repeat;
  background-size: 200px 100px;
}

.stars2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 100s linear infinite;
}

.stars2:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 25px 25px, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 50px 75px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 125px 45px, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 175px 85px, rgba(255,255,255,0.6), transparent);
  background-repeat: repeat;
  background-size: 300px 150px;
}

.stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 150s linear infinite;
}

.stars3:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 10px 10px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 150px 150px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 60px 170px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 175px 30px, rgba(255,255,255,0.3), transparent),
    radial-gradient(2px 2px at 195px 195px, rgba(255,255,255,0.4), transparent);
  background-repeat: repeat;
  background-size: 400px 200px;
}

@keyframes animateStars {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
}

.system-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
}

/* Realistic Earth Styles */
.earth-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 240px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.earth-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 0 60px 20px #1e90ff44, 0 0 0 8px #1e90ff22;
  animation: earth-rotate 8s linear infinite;
  object-fit: cover;
}
@keyframes earth-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.earth {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: 
    radial-gradient(circle at 25% 25%, #87ceeb 0%, #4682b4 30%, #1e40af 60%, #0f172a 100%),
    conic-gradient(from 0deg at 50% 50%, 
      #1e40af 0deg, #2563eb 60deg, #3b82f6 120deg, 
      #1e40af 180deg, #1e3a8a 240deg, #2563eb 300deg, #1e40af 360deg);
  background-blend-mode: multiply;
  animation: rotate 30s linear infinite;
  box-shadow: 
    inset -40px -40px 80px rgba(0,0,0,0.6),
    inset 20px 20px 40px rgba(135,206,235,0.2),
    0 0 60px rgba(30,144,255,0.8),
    0 0 120px rgba(59,130,246,0.4),
    0 0 200px rgba(30,144,255,0.2);
  filter: brightness(1.1) contrast(1.2);
}

.earth-continents {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: 
    radial-gradient(ellipse 45px 35px at 25% 35%, #2d5016 0%, #3d6b1f 40%, transparent 70%),
    radial-gradient(ellipse 40px 30px at 70% 25%, #2d5016 0%, #4a7c2a 50%, transparent 80%),
    radial-gradient(ellipse 50px 40px at 60% 70%, #1f3d0c 0%, #2d5016 30%, #4a7c2a 60%, transparent 85%),
    radial-gradient(ellipse 35px 45px at 20% 75%, #2d5016 0%, #3d6b1f 45%, transparent 75%),
    radial-gradient(ellipse 30px 25px at 80% 60%, #1f3d0c 0%, #2d5016 40%, transparent 70%),
    radial-gradient(ellipse 25px 20px at 15% 50%, #2d5016 0%, #4a7c2a 50%, transparent 80%);
  opacity: 0.9;
  mix-blend-mode: overlay;
}

.earth-atmosphere {
  position: absolute;
  top: -5px;
  left: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 10px);
  border-radius: 50%;
  background: radial-gradient(circle, transparent 85%, rgba(135,206,235,0.3) 90%, transparent 100%);
}

.earth-clouds {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: 
    radial-gradient(ellipse 30px 15px at 30% 20%, rgba(255,255,255,0.4), transparent),
    radial-gradient(ellipse 25px 12px at 70% 40%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 35px 18px at 45% 65%, rgba(255,255,255,0.35), transparent),
    radial-gradient(ellipse 20px 10px at 80% 80%, rgba(255,255,255,0.3), transparent);
  animation: rotate 45s linear infinite reverse;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Communication Lines */
.communication-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.comm-line {
  position: absolute;
}

@keyframes commBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Enhanced Realistic Satellite Styles */
.satellite {
  position: absolute;
  width: 60px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
}

.satellite:hover {
  transform: scale(1.15);
  filter: brightness(1.3) drop-shadow(0 0 15px rgba(59, 130, 246, 0.6));
}

.satellite.top {
  top: 50px;
  left: 270px;
}

.satellite.right {
  right: 50px;
  top: 270px;
}

.satellite.bottom {
  bottom: 50px;
  left: 270px;
}

.satellite.left {
  left: 50px;
  top: 270px;
}

.satellite-body {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
}

.solar-panel {
  width: 18px;
  height: 32px;
  background: 
    linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%),
    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  border: 1px solid #0f172a;
  position: relative;
  border-radius: 3px;
  box-shadow: 
    inset 0 2px 4px rgba(255,255,255,0.3),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    0 4px 8px rgba(0,0,0,0.4),
    0 0 10px rgba(59,130,246,0.3);
  transform: perspective(100px) rotateX(5deg);
}

.panel-cells {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0.2) 0px,
      rgba(255,255,255,0.2) 2px,
      rgba(255,255,255,0.05) 2px,
      rgba(255,255,255,0.05) 4px,
      rgba(255,255,255,0.15) 4px,
      rgba(255,255,255,0.15) 6px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.15) 0px,
      rgba(255,255,255,0.15) 1px,
      transparent 1px,
      transparent 3px
    ),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 2px;
  animation: solarGlow 3s ease-in-out infinite alternate;
}

@keyframes solarGlow {
  0% { filter: brightness(1) saturate(1); }
  100% { filter: brightness(1.1) saturate(1.2); }
}

.satellite-core {
  width: 24px;
  height: 24px;
  background: 
    linear-gradient(135deg, #1f2937 0%, #374151 25%, #4b5563 50%, #6b7280 75%, #9ca3af 100%),
    radial-gradient(circle at 30% 30%, rgba(251,191,36,0.3) 0%, transparent 70%);
  border: 2px solid #f59e0b;
  border-radius: 4px;
  position: relative;
  margin: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 2px 4px rgba(255,255,255,0.2),
    inset 0 -2px 4px rgba(0,0,0,0.3),
    0 0 15px rgba(245,158,11,0.5),
    0 4px 8px rgba(0,0,0,0.5),
    0 0 25px rgba(251,191,36,0.3);
  transform: perspective(50px) rotateX(10deg);
}

.core-light {
  width: 8px;
  height: 8px;
  background: 
    radial-gradient(circle at 30% 30%, #34d399 0%, #10b981 50%, #047857 100%);
  border-radius: 50%;
  animation: corePulse 2s ease-in-out infinite;
  box-shadow: 
    0 0 15px #10b981,
    0 0 25px rgba(16,185,129,0.6),
    inset 0 1px 2px rgba(255,255,255,0.3);
  position: relative;
}

.core-light::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 3px;
  height: 3px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  animation: corePulse 2s ease-in-out infinite reverse;
}

@keyframes corePulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
    box-shadow: 
      0 0 15px #10b981,
      0 0 25px rgba(16,185,129,0.6),
      inset 0 1px 2px rgba(255,255,255,0.3);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.2);
    box-shadow: 
      0 0 25px #10b981,
      0 0 40px rgba(16,185,129,0.8),
      inset 0 1px 2px rgba(255,255,255,0.5);
  }
}

.antenna-dish {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 6px;
  background: linear-gradient(45deg, #d1d5db, #9ca3af);
  border-radius: 50% 50% 0 0;
  border: 1px solid #6b7280;
}

.satellite-antenna {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 8px;
  background: #9ca3af;
}

.satellite-antenna::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -2px;
  width: 5px;
  height: 3px;
  background: #fbbf24;
  border-radius: 50%;
}



/* Enhanced Context Menu */
.context-menu {
  position: absolute;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.6),
    0 0 20px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.1);
  z-index: 1000;
  min-width: 110px;
  backdrop-filter: blur(15px);
  animation: menuFadeIn 0.2s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.menu-arrow.top {
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-items {
  padding: 6px 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 18px;
  color: #f9fafb;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  border-radius: 6px;
  margin: 2px 4px;
  position: relative;
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.3));
  color: #ffffff;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.menu-item:active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(99, 102, 241, 0.5));
  transform: translateX(1px);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}
</style>