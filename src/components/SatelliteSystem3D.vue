<template>
  <div class="satellite-system-3d">
    <Renderer ref="renderer" antialias :orbit-ctrl="true" resize="window" :background="'#000011'">
      <Camera :position="{ x: 0, y: 0, z: 15 }" />
      <Scene>
        <!-- Ambient Light -->
        <AmbientLight color="#404040" :intensity="0.4" />
        
        <!-- Directional Light (Sun) -->
        <DirectionalLight 
          color="#ffffff" 
          :intensity="1" 
          :position="{ x: 10, y: 10, z: 5 }" 
          :cast-shadow="true"
        />
        
        <!-- Earth -->
        <Sphere 
          ref="earth" 
          :radius="2" 
          :width-segments="64" 
          :height-segments="64"
          :position="{ x: 0, y: 0, z: 0 }"
        >
          <BasicMaterial 
            :props="{
              map: earthTexture,
              transparent: false
            }"
          />
        </Sphere>
        
        <!-- Earth Atmosphere -->
        <Sphere 
          ref="atmosphere" 
          :radius="2.1" 
          :width-segments="32" 
          :height-segments="32"
          :position="{ x: 0, y: 0, z: 0 }"
        >
          <BasicMaterial 
            :props="{
              color: '#87CEEB',
              transparent: true,
              opacity: 0.3,
              side: 1
            }"
          />
        </Sphere>
        
        <!-- Satellites -->
        <Group 
          v-for="(satellite, index) in satellites" 
          :key="index"
          :ref="el => satelliteRefs[index] = el"
          :position="satellite.position"
          @click="(event) => showContextMenu(event, index)"
          @pointer-enter="() => {}"
          @pointer-leave="() => {}"
        >
          <!-- Satellite Body (增大尺寸) -->
          <Box 
            :width="0.6" 
            :height="0.4" 
            :depth="0.4"
            :position="{ x: 0, y: 0, z: 0 }"
          >
            <StandardMaterial 
              :props="{
                color: '#6B7280',
                metalness: 0.8,
                roughness: 0.2,
                emissive: '#1F2937',
                emissiveIntensity: 0.1
              }"
            />
          </Box>
          
          <!-- Solar Panels (增大尺寸和亮度) -->
          <Box 
            :width="1.2" 
            :height="0.08" 
            :depth="0.6"
            :position="{ x: -0.6, y: 0, z: 0 }"
          >
            <StandardMaterial 
              :props="{
                color: '#2563EB',
                metalness: 0.1,
                roughness: 0.1,
                emissive: '#1E40AF',
                emissiveIntensity: 0.2
              }"
            />
          </Box>
          
          <Box 
            :width="1.2" 
            :height="0.08" 
            :depth="0.6"
            :position="{ x: 0.6, y: 0, z: 0 }"
          >
            <StandardMaterial 
              :props="{
                color: '#2563EB',
                metalness: 0.1,
                roughness: 0.1,
                emissive: '#1E40AF',
                emissiveIntensity: 0.2
              }"
            />
          </Box>
          
          <!-- Antenna (增大尺寸) -->
          <Cylinder 
            :radius-top="0.04" 
            :radius-bottom="0.04" 
            :height="0.5"
            :position="{ x: 0, y: 0.3, z: 0 }"
          >
            <StandardMaterial 
              :props="{
                color: '#F59E0B',
                metalness: 0.9,
                roughness: 0.1,
                emissive: '#D97706',
                emissiveIntensity: 0.3
              }"
            />
          </Cylinder>
          
          <!-- 卫星指示灯 -->
          <Sphere 
            :radius="0.05" 
            :position="{ x: 0, y: 0.1, z: 0.25 }"
          >
            <StandardMaterial 
              :props="{
                color: '#10B981',
                emissive: '#10B981',
                emissiveIntensity: 0.8
              }"
            />
          </Sphere>
        </Group>
        
        <!-- Communication Lines -->
        <template v-for="(line, index) in communicationLines" :key="index">
          <Mesh 
            :ref="el => lineRefs[index] = el"
            :geometry="line.geometry"
            :material="line.material"
          />
        </template>
        
        <!-- Stars Background -->
        <Points ref="stars" :position="{ x: 0, y: 0, z: 0 }">
          <PointsMaterial 
            :props="{
              color: '#ffffff',
              size: 0.1,
              transparent: true,
              opacity: 0.8
            }"
          />
        </Points>
      </Scene>
    </Renderer>
    
    <!-- Context Menu -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu-3d"
      :style="{ 
        left: contextMenu.x + 'px', 
        top: contextMenu.y + 'px'
      }"
      @click.stop
    >
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
    
    <!-- Click outside to close menu -->
    <div 
      v-if="contextMenu.visible" 
      class="overlay"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Renderer, Camera, Scene, 
  AmbientLight, DirectionalLight,
  Sphere, Box, Cylinder, Group, Points, Mesh,
  BasicMaterial, StandardMaterial, PointsMaterial
} from 'troisjs'
import * as THREE from 'three'

const renderer = ref(null)
const earth = ref(null)
const atmosphere = ref(null)
const stars = ref(null)
const satelliteRefs = ref([])
const lineRefs = ref([])

// Earth texture (you can replace with actual texture URL)
const earthTexture = ref(null)

// Satellite positions in 3D space (around Earth)
const satellites = ref([
  { position: { x: 0, y: 4, z: 0 }, name: 'North Satellite' },
  { position: { x: 4, y: 0, z: 0 }, name: 'East Satellite' },
  { position: { x: 0, y: -4, z: 0 }, name: 'South Satellite' },
  { position: { x: -4, y: 0, z: 0 }, name: 'West Satellite' }
])

// Communication lines between satellites
const communicationLines = ref([])

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  satelliteIndex: -1
})

const menuItems = ref(['通信状态', '轨道信息', '系统诊断'])

// Create stars geometry
const createStars = () => {
  const starsGeometry = new THREE.BufferGeometry()
  const starsCount = 1000
  const positions = new Float32Array(starsCount * 3)
  
  for (let i = 0; i < starsCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100
  }
  
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return starsGeometry
}

// Create communication lines
const createCommunicationLines = () => {
  const lines = []
  
  // 创建连线材质
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00FF88, 
    linewidth: 3,
    transparent: true,
    opacity: 0.8
  })
  
  // Connect each satellite to adjacent ones
  for (let i = 0; i < satellites.value.length; i++) {
    const current = satellites.value[i]
    const next = satellites.value[(i + 1) % satellites.value.length]
    
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(current.position.x, current.position.y, current.position.z),
      new THREE.Vector3(next.position.x, next.position.y, next.position.z)
    ])
    
    lines.push({
      geometry: geometry,
      material: lineMaterial
    })
  }
  
  // Add diagonal connections
  const diagonalGeometry1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(satellites.value[0].position.x, satellites.value[0].position.y, satellites.value[0].position.z),
    new THREE.Vector3(satellites.value[2].position.x, satellites.value[2].position.y, satellites.value[2].position.z)
  ])
  
  const diagonalGeometry2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(satellites.value[1].position.x, satellites.value[1].position.y, satellites.value[1].position.z),
    new THREE.Vector3(satellites.value[3].position.x, satellites.value[3].position.y, satellites.value[3].position.z)
  ])
  
  lines.push({
    geometry: diagonalGeometry1,
    material: lineMaterial
  })
  
  lines.push({
    geometry: diagonalGeometry2,
    material: lineMaterial
  })
  
  return lines
}

// Create realistic earth texture
const createEarthTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  // 创建海洋背景
  const oceanGradient = ctx.createRadialGradient(512, 256, 0, 512, 256, 400)
  oceanGradient.addColorStop(0, '#1E3A8A')
  oceanGradient.addColorStop(0.5, '#1E40AF')
  oceanGradient.addColorStop(1, '#1E3A8A')
  
  ctx.fillStyle = oceanGradient
  ctx.fillRect(0, 0, 1024, 512)
  
  // 添加海洋纹理
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(30, 64, 175, ${0.1 + Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 创建大陆 - 更真实的形状和颜色
  const continents = [
    // 北美洲
    { x: 200, y: 150, width: 180, height: 120, color: '#22543D' },
    // 南美洲
    { x: 250, y: 280, width: 100, height: 150, color: '#2D5016' },
    // 欧洲
    { x: 450, y: 120, width: 80, height: 60, color: '#276749' },
    // 非洲
    { x: 480, y: 200, width: 120, height: 180, color: '#22543D' },
    // 亚洲
    { x: 600, y: 100, width: 200, height: 140, color: '#2D5016' },
    // 澳洲
    { x: 750, y: 320, width: 100, height: 60, color: '#276749' }
  ]
  
  continents.forEach(continent => {
    // 主要陆地形状
    ctx.fillStyle = continent.color
    ctx.beginPath()
    ctx.ellipse(continent.x, continent.y, continent.width/2, continent.height/2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 添加山脉和高原（更深的绿色）
    ctx.fillStyle = '#1A202C'
    for (let i = 0; i < 5; i++) {
      const x = continent.x + (Math.random() - 0.5) * continent.width * 0.6
      const y = continent.y + (Math.random() - 0.5) * continent.height * 0.6
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 添加森林区域（中等绿色）
    ctx.fillStyle = '#065F46'
    for (let i = 0; i < 8; i++) {
      const x = continent.x + (Math.random() - 0.5) * continent.width * 0.8
      const y = continent.y + (Math.random() - 0.5) * continent.height * 0.8
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 10 + 3, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  
  // 添加云层效果
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const size = Math.random() * 30 + 10
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 添加极地冰帽
  const iceGradient = ctx.createLinearGradient(0, 0, 0, 50)
  iceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  iceGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)')
  
  ctx.fillStyle = iceGradient
  ctx.fillRect(0, 0, 1024, 50) // 北极
  ctx.fillRect(0, 462, 1024, 50) // 南极
  
  return new THREE.CanvasTexture(canvas)
}

const showContextMenu = (event, index) => {
  // 阻止事件冒泡
  event.stopPropagation()
  
  // 获取鼠标位置
  let clientX, clientY
  if (event.clientX !== undefined) {
    clientX = event.clientX
    clientY = event.clientY
  } else if (event.originalEvent) {
    clientX = event.originalEvent.clientX
    clientY = event.originalEvent.clientY
  } else {
    // 如果无法获取鼠标位置，使用屏幕中心
    clientX = window.innerWidth / 2
    clientY = window.innerHeight / 2
  }
  
  contextMenu.value = {
    visible: true,
    x: clientX,
    y: clientY,
    satelliteIndex: index
  }
  
  console.log(`点击了卫星 ${index}: ${satellites.value[index].name}`)
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const handleMenuClick = (item) => {
  const satellite = satellites.value[contextMenu.value.satelliteIndex]
  console.log(`执行 ${item} 功能，卫星: ${satellite.name}`)
  alert(`执行 ${item} 功能，卫星: ${satellite.name}`)
  closeContextMenu()
}

const handleClickOutside = () => {
  if (contextMenu.value.visible) {
    closeContextMenu()
  }
}

onMounted(() => {
  // Create earth texture
  earthTexture.value = createEarthTexture()
  
  // Create communication lines
  communicationLines.value = createCommunicationLines()
  
  // Setup stars
  if (stars.value) {
    const starsGeometry = createStars()
    stars.value.setGeometry(starsGeometry)
  }
  
  // Add animation
  if (renderer.value) {
    renderer.value.onBeforeRender(() => {
      // Rotate Earth
      if (earth.value && earth.value.mesh) {
        earth.value.mesh.rotation.y += 0.005
      }
      
      // Rotate atmosphere
      if (atmosphere.value && atmosphere.value.mesh) {
        atmosphere.value.mesh.rotation.y += 0.003
      }
      
      // Animate satellites (optional orbital motion)
      satelliteRefs.value.forEach((satellite, index) => {
        if (satellite && satellite.group) {
          const time = Date.now() * 0.001
          const angle = time * 0.2 + (index * Math.PI * 0.5)
          const radius = 4
          
          satellite.group.position.x = Math.cos(angle) * radius
          satellite.group.position.z = Math.sin(angle) * radius
          
          // Update satellite position data for communication lines
          satellites.value[index].position.x = satellite.group.position.x
          satellites.value[index].position.z = satellite.group.position.z
        }
      })
      
      // Update communication lines dynamically
      const newLines = createCommunicationLines()
      communicationLines.value = newLines
    })
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.satellite-system-3d {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000011;
}

.context-menu-3d {
  position: absolute;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.6),
    0 0 20px rgba(59, 130, 246, 0.2);
  z-index: 1000;
  min-width: 120px;
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
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.3));
  color: #ffffff;
  transform: translateX(2px);
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