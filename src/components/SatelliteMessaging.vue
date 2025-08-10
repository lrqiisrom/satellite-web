<template>
  <div class="satellite-messaging">
    <!-- 广播消息侧边栏 -->
    <BroadcastSidePanel
      v-model:visible="broadcastSidePanelVisible"
      :satellite-index="selectedSatelliteIndex"
      :satellite-count="satelliteCount"
      @close="closeBroadcastSidePanel"
      @encrypt="handleEncrypt"
      @broadcast="handleBroadcast"
    />
    
    <!-- 拦截消息模态框 -->
    <InterceptModal
      v-model:visible="interceptModalVisible"
      :interceptor="satelliteFaultRef?.unkindSatellite"
      :sender="interceptedSender"
      :receiver="interceptedReceiver"
      :ciphertext="interceptedCiphertext"
      @send-tampered="handleSendTampered"
      @send-injected="handleSendInjected"
      @close="handleInterceptModalClose"
    />
    
    <!-- 查看消息和解密模态框 -->
    <ViewMessageModal
      v-model:visible="viewMessageModalVisible"
      :satellite-index="selectedSatelliteIndex"
      :messages="satelliteMessages"
      @message-decrypted="handleMessageDecrypted"
      @close="handleViewMessageModalClose"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, inject } from 'vue'
import BroadcastSidePanel from './BroadcastSidePanel.vue'
import InterceptModal from './InterceptModal.vue'
import ViewMessageModal from './ViewMessageModal.vue'
import satelliteEncryptionService from '../services/SatelliteEncryptionService'

const props = defineProps({
  satelliteCount: {
    type: Number,
    default: 0
  },
  satellitePositions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['message-sent', 'message-received', 'message-decrypted'])

// 获取卫星故障引用
const satelliteFaultRef = inject('satelliteFaultRef')

// 状态变量
const broadcastSidePanelVisible = ref(false)
const viewMessageModalVisible = ref(false)
const selectedSatelliteIndex = ref(-1)
const satelliteMessages = ref([])

// 拦截相关状态
const interceptModalVisible = ref(false)
const interceptedSender = ref(-1)
const interceptedReceiver = ref(-1)
const interceptedCiphertext = ref('')



// 存储每个卫星接收到的消息
const satelliteMessageMap = ref({})

// 打开广播消息侧边栏
const openBroadcastSidePanel = (satelliteIndex) => {
  selectedSatelliteIndex.value = satelliteIndex
  broadcastSidePanelVisible.value = true
  // 发出事件通知父组件广播侧边栏已打开
  emit('broadcast-panel-opened')
}

// 关闭广播消息侧边栏
const closeBroadcastSidePanel = () => {
  console.log('SatelliteMessaging: 关闭广播消息侧边栏')
  broadcastSidePanelVisible.value = false
  // 发出事件通知父组件广播侧边栏已关闭
  emit('broadcast-panel-closed')
}

// 处理加密
const handleEncrypt = async ({ senderIndex, receiverIndex, message, onSuccess }) => {
  try {
    const ciphertext = await satelliteEncryptionService.encryptMessage({
      senderIndex,
      receiverIndex,
      message
    })
    
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(ciphertext)
    }
  } catch (error) {
    console.error('加密失败:', error)
  }
}

// 处理广播
const handleBroadcast = ({ senderIndex, receiverIndex, ciphertext }) => {
  console.log('开始处理广播消息:', '发送方:', senderIndex, '接收方:', receiverIndex)
  console.log('satelliteFaultRef:', satelliteFaultRef.value)
  
  // 检查是否有恶意卫星 - 修正访问方式
  const unkindSatelliteIndex = satelliteFaultRef.value?.unkindSatellite
  console.log('恶意卫星索引:', unkindSatelliteIndex, typeof unkindSatelliteIndex)
  
  // 检查是否存在恶意卫星
  if (unkindSatelliteIndex !== undefined) {
    console.log('检测到恶意卫星，拦截消息:', unkindSatelliteIndex, '发送方:', senderIndex, '接收方:', receiverIndex)
    
    // 设置全局变量，禁用查看密文按钮
    window.isIntercepting = true
    
    // 先触发消息发送事件，显示从发送方到恶意节点的绿色虚线
    emit('message-sent', {
      senderIndex,
      receiverIndex,
      ciphertext,
      interceptedBy: unkindSatelliteIndex,
      showInterceptAnimation: true
    })
    
    // 存在恶意卫星，设置拦截消息信息
    interceptedSender.value = senderIndex
    interceptedReceiver.value = receiverIndex
    interceptedCiphertext.value = ciphertext
    
    // 关闭侧边栏
    closeBroadcastSidePanel()
    
    // 延迟0.5秒显示拦截弹窗
    setTimeout(() => {
      // 显示拦截弹窗
      interceptModalVisible.value = true
      console.log('拦截弹窗状态:', interceptModalVisible.value)
      // 恢复查看密文按钮
      window.isIntercepting = false
    }, 500)
    
    return // 拦截后不继续广播
  }
  
  console.log('没有检测到恶意卫星，正常广播消息')
  
  // 没有恶意卫星，正常广播消息到所有卫星
  for (let i = 0; i < props.satelliteCount; i++) {
    // 正常存储消息到卫星
    storeMessage({
      senderIndex,
      receiverIndex,
      targetIndex: i,
      ciphertext
    })
  }
  
  emit('message-sent', {
    senderIndex,
    receiverIndex,
    ciphertext
  })
  
  // 关闭侧边栏
  closeBroadcastSidePanel()
}

// 存储消息
const storeMessage = ({ senderIndex, receiverIndex, targetIndex, ciphertext, originalCiphertext, isTampered, isInjected }) => {
  const message = {
    senderIndex,
    receiverIndex,
    targetIndex,
    ciphertext,
    timestamp: Date.now()
  }
  
  // 如果有原始密文，添加到消息对象
  if (originalCiphertext) {
    message.originalCiphertext = originalCiphertext
  }
  
  // 设置篡改和注入标志
  if (isTampered) {
    message.isTampered = true
  }
  
  if (isInjected) {
    message.isInjected = true
  }
  
  console.log(`存储消息到卫星 ${targetIndex}:`, { 
    isTampered: !!message.isTampered, 
    isInjected: !!message.isInjected, 
    hasOriginalCiphertext: !!message.originalCiphertext 
  })
  
  // 确保目标卫星的消息数组已初始化
  if (!satelliteMessageMap.value[targetIndex]) {
    satelliteMessageMap.value[targetIndex] = []
  }
  
  // 将消息添加到目标卫星的消息数组中
  satelliteMessageMap.value[targetIndex].push(message)
  
  emit('message-received', {
    senderIndex,
    receiverIndex,
    targetIndex,
    ciphertext,
    isTampered,
    isInjected,
    originalCiphertext
  })
}

// 打开查看消息模态框
const openViewMessageModal = (satelliteIndex) => {
  selectedSatelliteIndex.value = satelliteIndex
  // 获取当前卫星的消息列表
  satelliteMessages.value = satelliteMessageMap.value[satelliteIndex] || []
  viewMessageModalVisible.value = true
}

// 处理消息解密事件
const handleMessageDecrypted = (event) => {
  emit('message-decrypted', event)
}

// 处理查看消息模态框关闭
const handleViewMessageModalClose = () => {
  viewMessageModalVisible.value = false
}



// 处理发送篡改后的消息
const handleSendTampered = ({ sender, receiver, originalCiphertext, tamperedCiphertext }) => {
  console.log('处理篡改消息:', sender, receiver, originalCiphertext.length, tamperedCiphertext.length)
  console.log('发送方:', sender, '接收方:', receiver, '原始密文:', originalCiphertext, '篡改密文:', tamperedCiphertext)
  
  // 存储篡改后的消息
  for (let i = 0; i < props.satelliteCount; i++) {
    // 发送方看到原始密文，接收方看到篡改密文，其他节点看到原始密文
    storeMessage({
      senderIndex: sender,
      receiverIndex: receiver,
      targetIndex: i,
      ciphertext: i === receiver ? tamperedCiphertext : originalCiphertext,
      originalCiphertext: originalCiphertext,
      isTampered: i === receiver
    })
  }
  
  // 触发消息发送事件，显示动画
  const messageData = {
    senderIndex: sender,
    receiverIndex: receiver,
    ciphertext: tamperedCiphertext,
    originalCiphertext: originalCiphertext,
    isTampered: true,
    message: 'TAMPERED',
    timestamp: Date.now()
  };
  console.log('发送篡改消息事件:', messageData);
  emit('message-sent', messageData);
  
  // 关闭拦截模态框
  interceptModalVisible.value = false
  console.log('拦截模态框已关闭')
}

// 处理发送注入的消息
const handleSendInjected = ({ sender, receiver, originalCiphertext, injectedCiphertext }) => {
  console.log('处理注入消息:', sender, receiver, originalCiphertext.length, injectedCiphertext.length)
  console.log('发送方:', sender, '接收方:', receiver, '原始密文:', originalCiphertext, '注入密文:', injectedCiphertext)
  
  // 存储注入后的消息
  for (let i = 0; i < props.satelliteCount; i++) {
    // 发送方看到原始密文，接收方看到注入密文，其他节点看到原始密文
    storeMessage({
      senderIndex: sender,
      receiverIndex: receiver,
      targetIndex: i,
      ciphertext: i === receiver ? injectedCiphertext : originalCiphertext,
      originalCiphertext: originalCiphertext,
      isInjected: i === receiver
    })
  }
  
  // 触发消息发送事件，显示动画
  const messageData = {
    senderIndex: sender,
    receiverIndex: receiver,
    ciphertext: injectedCiphertext,
    originalCiphertext: originalCiphertext,
    isInjected: true,
    message: 'INJECTED',
    timestamp: Date.now()
  };
  console.log('发送注入消息事件:', messageData);
  emit('message-sent', messageData);
  
  // 关闭拦截模态框
  interceptModalVisible.value = false
  console.log('拦截模态框已关闭')
}

// 处理拦截模态框关闭
const handleInterceptModalClose = () => {
  interceptModalVisible.value = false
}

// 暴露方法给父组件
defineExpose({
  openBroadcastSidePanel,
  openViewMessageModal,
  storeMessage
})
</script>

<style scoped>
.satellite-messaging {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 默认不接收点击事件 */
  z-index: 100;
}

/* 确保侧边栏和模态框可以接收点击事件 */
.satellite-messaging > * {
  pointer-events: auto;
}

/* 添加通用模态框样式 */
:deep(.modal-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

:deep(.modal-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid #334155;
}

:deep(.modal-content) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.close-btn) {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

:deep(.close-btn:hover) {
  color: #f8fafc;
}
</style>