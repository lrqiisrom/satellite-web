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
    
    <!-- 解密消息模态框 -->
    <DecryptMessageModal
      v-model:visible="decryptModalVisible"
      :satellite-index="selectedSatelliteIndex"
      :ciphertext="selectedCiphertext"
      :sender-index="messageSenderIndex"
      :receiver-index="messageReceiverIndex"
      @close="closeDecryptModal"
      @decrypt="handleDecrypt"
    />
    
    <!-- 消息通知 -->
    <div v-for="(notification, index) in activeNotifications" :key="index"
         class="message-notification"
         :style="getNotificationStyle(notification)">
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-title">📡 收到加密消息</span>
          <button class="notification-close" @click="dismissNotification(index)">&times;</button>
        </div>
        <div class="notification-body">
          <p>从 卫星{{ notification.senderIndex + 1 }} 发送</p>
          <p class="notification-cipher">{{ truncateCiphertext(notification.ciphertext) }}</p>
          <button class="decrypt-button" @click="openDecryptModal(notification)">
            🔓 尝试解密
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import BroadcastSidePanel from './BroadcastSidePanel.vue'
import DecryptMessageModal from './DecryptMessageModal.vue'
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

// 状态变量
const broadcastSidePanelVisible = ref(false)
const decryptModalVisible = ref(false)
const selectedSatelliteIndex = ref(-1)
const selectedCiphertext = ref('')
const messageSenderIndex = ref(-1)
const messageReceiverIndex = ref(-1)
const activeNotifications = ref([])

// 打开广播消息侧边栏
const openBroadcastSidePanel = (satelliteIndex) => {
  selectedSatelliteIndex.value = satelliteIndex
  broadcastSidePanelVisible.value = true
}

// 关闭广播消息侧边栏
const closeBroadcastSidePanel = () => {
  console.log('SatelliteMessaging: 关闭广播消息侧边栏')
  broadcastSidePanelVisible.value = false
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
  // 广播消息到所有卫星
  for (let i = 0; i < props.satelliteCount; i++) {
    if (i !== senderIndex) {
      // 创建消息通知
      showMessageNotification({
        senderIndex,
        receiverIndex,
        targetIndex: i,
        ciphertext
      })
    }
  }
  
  emit('message-sent', {
    senderIndex,
    receiverIndex,
    ciphertext
  })
  
  // 关闭侧边栏
  closeBroadcastSidePanel()
}

// 显示消息通知
const showMessageNotification = ({ senderIndex, receiverIndex, targetIndex, ciphertext }) => {
  const notification = {
    senderIndex,
    receiverIndex,
    targetIndex,
    ciphertext,
    timestamp: Date.now()
  }
  
  activeNotifications.value.push(notification)
  
  // 10秒后自动关闭通知
  setTimeout(() => {
    const index = activeNotifications.value.findIndex(n => n.timestamp === notification.timestamp)
    if (index !== -1) {
      activeNotifications.value.splice(index, 1)
    }
  }, 10000)
  
  emit('message-received', {
    senderIndex,
    receiverIndex,
    targetIndex,
    ciphertext
  })
}

// 关闭通知
const dismissNotification = (index) => {
  activeNotifications.value.splice(index, 1)
}

// 打开解密模态框
const openDecryptModal = (notification) => {
  selectedSatelliteIndex.value = notification.targetIndex
  selectedCiphertext.value = notification.ciphertext
  messageSenderIndex.value = notification.senderIndex
  messageReceiverIndex.value = notification.receiverIndex
  decryptModalVisible.value = true
}

// 关闭解密模态框
const closeDecryptModal = () => {
  decryptModalVisible.value = false
}

// 处理解密
const handleDecrypt = async ({ satelliteIndex, ciphertext, senderIndex, receiverIndex, onSuccess, onError }) => {
  try {
    const decryptedMessage = await satelliteEncryptionService.decryptMessage({
      satelliteIndex,
      ciphertext,
      senderIndex,
      receiverIndex
    })
    
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(decryptedMessage)
    }
    
    emit('message-decrypted', {
      satelliteIndex,
      ciphertext,
      senderIndex,
      receiverIndex,
      decryptedMessage
    })
  } catch (error) {
    console.error('解密失败:', error)
    
    if (onError && typeof onError === 'function') {
      onError(error.message || '解密失败')
    }
  }
}

// 获取通知样式
const getNotificationStyle = (notification) => {
  const satellitePosition = props.satellitePositions[notification.targetIndex]
  if (!satellitePosition) return {}
  
  return {
    position: 'absolute',
    left: `${satellitePosition.x + 30}px`,
    top: `${satellitePosition.y - 80}px`,
    zIndex: 100
  }
}

// 截断密文显示
const truncateCiphertext = (ciphertext) => {
  if (!ciphertext) return ''
  if (ciphertext.length <= 20) return ciphertext
  return ciphertext.substring(0, 10) + '...' + ciphertext.substring(ciphertext.length - 10)
}

// 暴露方法给父组件
defineExpose({
  openBroadcastSidePanel,
  getNotificationStyle
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

.message-notification {
  position: absolute;
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  pointer-events: auto;
  animation: notification-appear 0.3s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes notification-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-content {
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid #334155;
}

.notification-title {
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.9rem;
}

.notification-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #f8fafc;
}

.notification-body {
  padding: 15px;
}

.notification-body p {
  margin: 0 0 10px;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.notification-cipher {
  padding: 8px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  font-family: monospace;
  color: #94a3b8;
  margin-bottom: 15px !important;
  word-break: break-all;
}

.decrypt-button {
  width: 100%;
  padding: 8px 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.decrypt-button:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
}
</style>