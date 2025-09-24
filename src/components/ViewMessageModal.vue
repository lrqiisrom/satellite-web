<template>
  <div v-if="visible" class="modal-overlay" @click="close">
    <div class="view-message-modal" @click.stop>
      <div class="modal-header">
        <h3>查看消息</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      <div class="modal-content">
        <div class="satellite-info">
          <div class="info-label">当前卫星:</div>
          <div class="info-value">卫星 {{ satelliteIndex + 1 }}</div>
        </div>
        
        <div v-if="messages.length === 0" class="no-messages">
          <p>暂无接收到的消息</p>
        </div>
        
        <div v-else class="message-list">
          <div v-for="(message, index) in messages" :key="index" class="message-item">
            <div class="cipher-display">
              <div class="info-label">接收到的密文:</div>
              <div class="cipher-list">
                <div
                  v-for="(line, li) in splitCiphertext(message.ciphertext)"
                  :key="li"
                  class="cipher-item"
                  :class="{ 'post-decrypt-red': activeMessageIndex === index && (tamperDetected || injectionDetected) && result }"
                >
                  {{ line }}
                </div>
              </div>
              <div v-if="activeMessageIndex === index && (tamperDetected || injectionDetected) && result" class="tamper-tip">
                （监测到密文被{{ tamperDetected ? '篡改' : '注入' }}）
              </div>
            </div>
              
            <!-- 解密部分 -->
            <div v-if="activeMessageIndex === index">
              <div class="action-buttons">
                <button @click="decryptMessage(message)" class="decrypt-button">
                  🔓 解密
                </button>
              </div>
              
              <div class="decryption-result" v-if="result">
                <div class="result-banner" :class="isSuccess ? 'success' : ((tamperDetected || injectionDetected) ? 'warning' : 'error')">
                  <span class="icon">{{ resultIcon }}</span>
                  <span class="text">{{ resultStatus }}</span>
                </div>
                <div class="decrypted-message" v-if="decryptedMessage">
                  <div class="info-label">解密后的消息:</div>
                  <div class="message-text" :class="{ 'success-text': isSuccess, 'error-text': !isSuccess }">
                    {{ decryptedMessage }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 未选中时只显示解密按钮 -->
            <button v-else class="decrypt-button" @click="selectAndDecryptMessage(index, message)">
              🔓 解密
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import satelliteEncryptionService from '../services/SatelliteEncryptionService'

// 格式化密文显示
// eslint-disable-next-line no-unused-vars
const formatCiphertext = (ciphertext) => {
  return ciphertext.replace(/\n/g, '<br>')
}

// 新增：将密文拆分为多行数组
const splitCiphertext = (ciphertext) => {
  if (!ciphertext || typeof ciphertext !== 'string') return []
  return ciphertext.split('\n').filter(s => s.trim().length > 0)
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  satelliteIndex: {
    type: Number,
    default: -1
  },
  messages: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'message-decrypted', 'close'])

// 解密相关状态
const activeMessageIndex = ref(-1) // 当前选中的消息索引
const result = ref('') // 解密结果
const isSuccess = ref(false) // 解密是否成功
const decryptedMessage = ref('') // 解密后的消息
// 解密后再暴露的状态标记
const tamperDetected = ref(false)
const injectionDetected = ref(false)

// 计算结果状态文本
const resultStatus = computed(() => {
  const currentMessage = activeMessageIndex.value >= 0 ? props.messages[activeMessageIndex.value] : null
  if (isSuccess.value) {
    if (currentMessage?.senderIndex === props.satelliteIndex) {
      return '解密成功（当前消息由您发送）'
    }
    return '解密成功（您拥有解密权限）'
  } else {
    if (currentMessage?.isTampered) {
      return '解密失败：检测到密文被篡改'
    } else if (currentMessage?.isInjected) {
      return '解密失败：检测到密文被注入'
    }
    return '解密失败：您没有该消息的解密权限'
  }
})

// 图标：成功/告警(篡改/注入)/错误(无权限)
const resultIcon = computed(() => {
  if (isSuccess.value) return '✅'
  if (tamperDetected.value || injectionDetected.value) return '⚠️'
  return '❌'
})

// 选择消息并立即解密
const selectAndDecryptMessage = (index, message) => {
  // 如果已经选中了这条消息，则取消选中
  if (activeMessageIndex.value === index) {
    resetDecryptionState()
  } else {
    // 选中新消息并立即执行解密
    activeMessageIndex.value = index
    decryptMessage(message)
  }
}

// 解密消息
const decryptMessage = async (message) => {
  try {
    console.log('解密消息:', message)
    // 检查消息是否被篡改或注入
    // eslint-disable-next-line no-unused-vars
    const originalCiphertext = message.originalCiphertext || message.ciphertext
    
    // 直接使用消息对象上的标记，或者通过比较密文判断
    const isTampered = message.isTampered === true || (message.originalCiphertext && message.ciphertext !== message.originalCiphertext && !message.ciphertext.startsWith(message.originalCiphertext))
    const isInjected = message.isInjected === true || (message.originalCiphertext && message.ciphertext !== message.originalCiphertext && message.ciphertext.startsWith(message.originalCiphertext))
    
    console.log('消息状态:', { isTampered, isInjected, originalCiphertext: !!message.originalCiphertext })
    
    if (isTampered) {
      console.log('检测到篡改消息')
      tamperDetected.value = true
      injectionDetected.value = false
      result.value = 'failure'
      isSuccess.value = false
      decryptedMessage.value = ''
      emit('message-decrypted', {
        satelliteIndex: props.satelliteIndex,
        ciphertext: message.ciphertext,
        originalCiphertext: message.originalCiphertext,
        senderIndex: message.senderIndex,
        receiverIndex: message.receiverIndex,
        success: false,
        decryptedMessage: '密文被篡改，解密失败',
        isTampered: true
      })
      // 不再 return，保证 UI 有 result 触发后续展示
    } else if (isInjected) {
      console.log('检测到注入消息')
      tamperDetected.value = false
      injectionDetected.value = true
      result.value = 'failure'
      isSuccess.value = false
      decryptedMessage.value = ''
      emit('message-decrypted', {
        satelliteIndex: props.satelliteIndex,
        ciphertext: message.ciphertext,
        originalCiphertext: message.originalCiphertext,
        senderIndex: message.senderIndex,
        receiverIndex: message.receiverIndex,
        success: false,
        decryptedMessage: '密文被注入，解密失败',
        isInjected: true
      })
      // 不再 return，保证 UI 有 result 触发后续展示
    }
    
    const decryptResult = await satelliteEncryptionService.decryptMessage({
      satelliteIndex: props.satelliteIndex,
      ciphertext: message.ciphertext,
      senderIndex: message.senderIndex,
      receiverIndex: message.receiverIndex
    })
    
    // 根据解密结果设置状态
    if (decryptResult.success) {
      result.value = 'success'
      isSuccess.value = true
      decryptedMessage.value = decryptResult.message
    } else {
      result.value = 'failure'
      isSuccess.value = false
      decryptedMessage.value = ''
    }
    
    emit('message-decrypted', {
      satelliteIndex: props.satelliteIndex,
      ciphertext: message.ciphertext,
      senderIndex: message.senderIndex,
      receiverIndex: message.receiverIndex,
      success: decryptResult.success,
      decryptedMessage: decryptResult.message,
      isTampered: message.isTampered || false,
      isInjected: message.isInjected || false
    })
  } catch (error) {
    console.error('解密失败:', error)
    result.value = 'failure'
    isSuccess.value = false
    decryptedMessage.value = error.message || ''
  }
}

// 重置解密状态
const resetDecryptionState = () => {
  activeMessageIndex.value = -1
  result.value = ''
  isSuccess.value = false
  decryptedMessage.value = ''
  tamperDetected.value = false
  injectionDetected.value = false
}

// 关闭模态框
const close = () => {
  resetDecryptionState()
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
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

.view-message-modal {
  width: 500px;
  max-width: 90%;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.3);
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  color: #f8fafc;
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0;
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

.modal-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.satellite-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
}

.info-label {
  color: #cbd5e1;
  font-weight: 500;
  margin-right: 10px;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.info-value {
  color: #f8fafc;
  font-weight: 600;
}

.no-messages {
  text-align: center;
  padding: 30px 0;
  color: #94a3b8;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(51, 65, 85, 0.8);
}

.cipher-display {
  margin-bottom: 15px;
}

/* 新增：密文列表样式（容器及单条密文框） */
.cipher-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  background: rgba(51, 65, 85, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
}
.cipher-list::-webkit-scrollbar {
  width: 6px;
}
.cipher-list::-webkit-scrollbar-track {
  background: transparent;
}
.cipher-list::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.8);
  border-radius: 6px;
}
.cipher-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.9);
}

.cipher-item {
  padding: 10px 12px;
  background: rgba(31, 41, 55, 0.7);
  border-radius: 8px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.cipher-item:hover {
  background: rgba(51, 65, 85, 0.7);
  border-color: rgba(148, 163, 184, 0.35);
}

/* 解密后异常时的强调（如在其他组件已有全局样式，这里可作为兜底） */
.post-decrypt-red {
  position: relative;
  border-color: rgba(244, 63, 94, 0.45) !important;
}
.post-decrypt-red::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: rgba(244, 63, 94, 0.85);
}
.tamper-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
  opacity: 0.9;
}

.message-text {
  padding: 10px;
  border-radius: 6px;
  font-family: monospace;
  margin-top: 5px;
  word-break: break-all;
}

.success-text {
  background: rgba(16, 185, 129, 0.1);
  color: #d1fae5;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.error-text {
  background: rgba(239, 68, 68, 0.1);
  color: #fee2e2;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tampered-text {
  color: red;
  font-weight: bold;
}

.injected-text {
  color: red;
  font-weight: bold;
}
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.decrypt-button {
  width: 100%;
  padding: 10px 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.35);
}
.decrypt-button:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(29, 78, 216, 0.4);
}
.decrypt-button:active {
  transform: translateY(0);
  box-shadow: 0 6px 12px rgba(29, 78, 216, 0.35);
}
.decrypt-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* 结果展示区域样式 */
.decryption-result { margin-top: 12px; }
.result-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.2);
  margin-top: 10px;
}
.result-banner .icon { font-size: 1rem; line-height: 1; }
.result-banner .text { font-size: 0.95rem; }
.result-banner.success {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
  color: #d1fae5;
}
.result-banner.warning {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fde68a;
}
.result-banner.error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fecaca;
}
</style>