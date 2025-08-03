<template>
  <div>
    <!-- 遮罩层，防止事件穿透 -->
    <div class="overlay" v-if="visible" @click="closePanel"></div>
    
    <div class="broadcast-side-panel" :class="{ 'visible': visible }">
      <div class="panel-header">
        <h3>广播消息</h3>
        <button class="close-btn" @click="closePanel">&times;</button>
      </div>
      <div class="panel-content">
        <div class="sender-info">
          <div class="info-label">发送方:</div>
          <div class="info-value">卫星 {{ satelliteIndex + 1 }}</div>
        </div>

        <div class="receiver-selection">
          <div class="info-label">接收方:</div>
          <select v-model="selectedReceiver" class="receiver-select">
            <option value="-1">请选择卫星</option>
            <option v-for="index in availableReceivers" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
        </div>

        <div class="message-input">
          <div class="info-label">消息内容:</div>
          <input v-model="message" type="text" placeholder="输入要发送的消息" class="message-field" />
        </div>

        <div class="cipher-result" v-if="ciphertext">
          <div class="info-label">密文:</div>
          <div class="cipher-text">{{ ciphertext }}</div>
        </div>

        <div class="action-buttons">
          <button @click="encryptMessage" :disabled="!canEncrypt" class="action-btn encrypt-btn">
            🔒 加密
          </button>
          <button @click="broadcastMessage" :disabled="!ciphertext" class="action-btn broadcast-btn">
            📡 广播
          </button>
        </div>

        <div class="operation-result" v-if="result">
          {{ result }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  satelliteIndex: {
    type: Number,
    default: -1
  },
  satelliteCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'encrypt', 'broadcast', 'update:visible'])

// 状态变量
const selectedReceiver = ref(-1)
const message = ref('')
const ciphertext = ref('')
const result = ref('')

// 关闭面板
const closePanel = () => {
  console.log('关闭侧边栏面板')
  emit('close')
  emit('update:visible', false)
}

// 计算可用的接收方（排除发送方自己）
const availableReceivers = computed(() => {
  const receivers = []
  for (let i = 0; i < props.satelliteCount; i++) {
    if (i !== props.satelliteIndex) {
      receivers.push(i)
    }
  }
  return receivers
})

// 验证是否可以加密
const canEncrypt = computed(() => {
  return selectedReceiver.value !== -1 && message.value.trim() !== ''
})

// 监听visible变化，重置状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 重置状态
    selectedReceiver.value = -1
    message.value = ''
    ciphertext.value = ''
    result.value = ''
  }
})

// 加密消息
const encryptMessage = () => {
  if (!canEncrypt.value) return
  
  result.value = '加密中...'
  
  emit('encrypt', {
    senderIndex: props.satelliteIndex,
    receiverIndex: selectedReceiver.value,
    message: message.value,
    onSuccess: (encryptedText) => {
      ciphertext.value = encryptedText
      result.value = '加密成功!'
    }
  })
}

// 广播消息
const broadcastMessage = () => {
  if (!ciphertext.value) return
  
  emit('broadcast', {
    senderIndex: props.satelliteIndex,
    receiverIndex: selectedReceiver.value,
    ciphertext: ciphertext.value
  })
  
  result.value = '广播成功!'
  
  // 3秒后关闭面板
  setTimeout(() => {
    closePanel()
  }, 3000)
}

// 暴露方法给父组件
defineExpose({
  closePanel
})
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999; /* 大幅提高遮罩层z-index */
  pointer-events: auto; /* 确保可以接收点击事件 */
}

.broadcast-side-panel {
  position: fixed;
  top: 0;
  right: -350px; /* 初始状态在屏幕外 */
  width: 350px;
  height: 100vh;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid #475569;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
  z-index: 10000; /* 大幅提高侧边栏z-index */
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  pointer-events: auto; /* 确保可以接收点击事件 */
}

.broadcast-side-panel.visible {
  right: 0; /* 显示状态 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #334155;
  background: rgba(30, 41, 59, 0.8);
}

.panel-header h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f8fafc;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.sender-info,
.receiver-selection,
.message-input,
.cipher-result {
  margin-bottom: 20px;
}

.info-label {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.info-value {
  color: #f8fafc;
  font-weight: 500;
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 8px;
  border: 1px solid #475569;
}

.receiver-select,
.message-field {
  width: 100%;
  padding: 10px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid #475569;
  border-radius: 8px;
  color: #f8fafc;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.receiver-select:focus,
.message-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.cipher-text {
  padding: 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid #475569;
  border-radius: 8px;
  color: #f8fafc;
  font-family: monospace;
  word-break: break-all;
  max-height: 100px;
  overflow-y: auto;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.encrypt-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.encrypt-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
}

.broadcast-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.broadcast-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
}

.action-btn:disabled {
  background: #475569;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.operation-result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(51, 65, 85, 0.5);
  color: #f8fafc;
  text-align: center;
}
</style>