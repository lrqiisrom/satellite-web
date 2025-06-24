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
    
    <!-- Function Buttons -->
    <div class="function-buttons">
      <button class="function-btn upload-btn" @click="handleUploadFile">
        📁 上传文件
      </button>
      <button class="function-btn query-btn" @click="showQueryModal">
        🔍 查询数据
      </button>
    </div>

    <!-- Query Modal -->
    <div v-if="queryModal.visible" class="modal-overlay" @click="closeQueryModal">
      <div class="query-modal" @click.stop>
        <div class="modal-header">
          <h3>数据查询</h3>
          <button class="close-btn" @click="closeQueryModal">×</button>
        </div>
        <div class="modal-content">
          <div class="query-input-section">
            <label for="queryInput">请输入查询条件：</label>
            <input 
              id="queryInput"
              v-model="queryModal.queryText" 
              type="text" 
              placeholder="输入要查询的数据..."
              class="query-input"
              @keyup.enter="handleQuery"
            />
            <button class="submit-query-btn" @click="handleQuery">
              提交查询
            </button>
          </div>
          <div class="query-results-section">
            <h4>查询结果：</h4>
            <div class="results-container">
              <div v-if="queryModal.loading" class="loading">查询中...</div>
              <div v-else-if="queryModal.results.length === 0" class="no-results">
                暂无查询结果
              </div>
              <div v-else class="results-list">
                <div 
                  v-for="(result, index) in queryModal.results" 
                  :key="index"
                  class="result-item"
                >
                  {{ result }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Input (hidden) -->
    <input 
      ref="fileInput" 
      type="file" 
      style="display: none" 
      @change="handleFileSelect"
      accept=".txt,.csv,.json,.xml"
    />

    <!-- Click outside to close menu -->
    <div 
      v-if="contextMenu.visible" 
      class="overlay"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineProps } from 'vue'

const props = defineProps({
  satelliteCount: {
    type: Number,
    default: 4,
    validator: (value) => value >= 3 && value <= 12
  }
})

const satelliteRefs = ref([])
const fileInput = ref(null)

const earthCenter = { x: 600, y: 600 } // system-container中心
const satelliteRadius = 350 // 调整轨道半径，确保卫星不超出界面

const satellites = ref(Array.from({ length: props.satelliteCount }, (_, i) => {
  const angle = (2 * Math.PI / props.satelliteCount) * i - Math.PI / 2 // 使第一个卫星在正上方
  return {
    x: earthCenter.x + satelliteRadius * Math.cos(angle),
    y: earthCenter.y + satelliteRadius * Math.sin(angle)
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

// Query Modal State
const queryModal = ref({
  visible: false,
  queryText: '',
  loading: false,
  results: []
})

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
  
  // 计算卫星相对于地球中心的位置
  const deltaX = satellite.x - earthCenter.x
  const deltaY = satellite.y - earthCenter.y
  
  let menuX = satellite.x + 70
  let menuY = satellite.y + 20
  let arrowPos = 'left'
  
  // 根据卫星位置动态调整菜单位置
  if (deltaY < -200) { // 上方
    menuX = satellite.x + 10
    menuY = satellite.y + 50
    arrowPos = 'top'
  } else if (deltaX > 200) { // 右方
    menuX = satellite.x - 110
    menuY = satellite.y + 5
    arrowPos = 'right'
  } else if (deltaY > 200) { // 下方
    menuX = satellite.x + 10
    menuY = satellite.y - 90
    arrowPos = 'bottom'
  } else if (deltaX < -200) { // 左方
    menuX = satellite.x + 70
    menuY = satellite.y + 5
    arrowPos = 'left'
  }
  
  contextMenu.value = {
    visible: true,
    x: menuX,
    y: menuY,
    transform: '',
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

// File Upload Functions
const handleUploadFile = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    console.log('选择的文件:', file.name)
    alert(`已选择文件: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n\n文件解析功能将在后续开发中实现。`)
    // 清空文件输入，允许重复选择同一文件
    event.target.value = ''
  }
}

// Query Modal Functions
const showQueryModal = () => {
  queryModal.value.visible = true
  queryModal.value.queryText = ''
  queryModal.value.results = []
}

const closeQueryModal = () => {
  queryModal.value.visible = false
  queryModal.value.loading = false
}

const handleQuery = () => {
  if (!queryModal.value.queryText.trim()) {
    alert('请输入查询条件')
    return
  }
  
  queryModal.value.loading = true
  queryModal.value.results = []
  
  // 模拟查询过程
  setTimeout(() => {
    queryModal.value.loading = false
    // 模拟查询结果
    queryModal.value.results = [
      `查询条件: "${queryModal.value.queryText}"`,
      '结果1: 卫星数据记录 #001',
      '结果2: 通信链路状态正常',
      '结果3: 轨道参数已更新',
      '注意: 这是模拟数据，实际查询功能将在后续开发中实现'
    ]
  }, 1500)
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
  width: 1200px;
  height: 1200px;
}

/* Realistic Earth Styles */
.earth-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  height: 480px;
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

/* Function Buttons */
.function-buttons {
  position: fixed;
  top: 30px;
  right: 30px;
  z-index: 1000;
  display: flex;
  gap: 15px;
}

.function-btn {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.function-btn:hover {
  background: rgba(31, 41, 55, 0.9);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.upload-btn:hover {
  border-color: #10b981;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.query-btn:hover {
  border-color: #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* Query Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.query-modal {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.8);
  backdrop-filter: blur(20px);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(31, 41, 55, 0.5);
}

.modal-header h3 {
  margin: 0;
  color: #f9fafb;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #f9fafb;
  background: rgba(239, 68, 68, 0.2);
}

.modal-content {
  padding: 25px;
  max-height: 60vh;
  overflow-y: auto;
}

.query-input-section {
  margin-bottom: 25px;
}

.query-input-section label {
  display: block;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 10px;
}

.query-input {
  width: 100%;
  padding: 12px 15px;
  font-size: 1rem;
  border: 2px solid #374151;
  border-radius: 10px;
  background: rgba(31, 41, 55, 0.8);
  color: #f9fafb;
  transition: all 0.3s ease;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.query-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.submit-query-btn {
  padding: 12px 25px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.submit-query-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
}

.query-results-section h4 {
  color: #f3f4f6;
  font-size: 1.1rem;
  margin-bottom: 15px;
  border-bottom: 1px solid #374151;
  padding-bottom: 10px;
}

.results-container {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
  padding: 15px;
}

.loading {
  text-align: center;
  color: #3b82f6;
  font-size: 1rem;
  padding: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.no-results {
  text-align: center;
  color: #9ca3af;
  font-size: 1rem;
  padding: 20px;
  font-style: italic;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  background: rgba(55, 65, 81, 0.6);
  border: 1px solid #4b5563;
  border-radius: 8px;
  padding: 12px 15px;
  color: #f9fafb;
  font-size: 0.95rem;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.result-item:hover {
  background: rgba(75, 85, 99, 0.8);
  border-color: #6b7280;
}

/* Scrollbar Styling */
.results-container::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track,
.modal-content::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.8);
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb:hover,
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.9);
}
</style>