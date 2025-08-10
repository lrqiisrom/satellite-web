<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="decrypt-modal" @click.stop>
      <div class="modal-header">
        <h3>解密消息</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      <div class="modal-content">
        <div class="satellite-info">
          <div class="info-label">当前卫星:</div>
          <div class="info-value">卫星 {{ satelliteIndex + 1 }}</div>
        </div>

        <div class="cipher-display">
          <div class="info-label">接收到的密文:</div>
          <div class="cipher-text">{{ ciphertext }}</div>
        </div>

        <div class="action-buttons">
          <button @click="decryptMessage" class="action-btn decrypt-btn">
            🔓 解密
          </button>
        </div>

        <div class="decryption-result" v-if="result">
          <div class="result-status" :class="{ 'success': isSuccess, 'error': !isSuccess }">
            {{ resultStatus }}
          </div>
          <div class="decrypted-message" v-if="decryptedMessage">
            <div class="info-label">解密后的消息:</div>
            <div class="message-text">{{ decryptedMessage }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  satelliteIndex: {
    type: Number,
    default: -1
  },
  ciphertext: {
    type: String,
    default: ''
  },
  senderIndex: {
    type: Number,
    default: -1
  },
  receiverIndex: {
    type: Number,
    default: -1
  },
  isTampered: {
    type: Boolean,
    default: false
  },
  isInjected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'decrypt', 'update:visible'])

// 关闭模态框
const closeModal = () => {
  emit('close')
  emit('update:visible', false)
}

// 状态变量
const result = ref('')
const isSuccess = ref(false)
const decryptedMessage = ref('')

// 计算结果状态文本
  const resultStatus = computed(() => {
    if (isSuccess.value) {
      return "✅ 有权解密，解密成功！密文未被篡改"
    } else {
      // 检查是否是篡改或注入消息
      if (props.isTampered) {
        return "密文被篡改，解密失败"
      } else if (props.isInjected) {
        return "密文被注入，解密失败"
      } else {
        return "❌ 未被授予解密权限！解密失败！"
      }
    }
})

// 监听visible变化，重置状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 打开模态框时重置状态
    result.value = ''
    isSuccess.value = false
    decryptedMessage.value = ''
  }
})

// 解密消息
const decryptMessage = () => {
  emit('decrypt', {
    satelliteIndex: props.satelliteIndex,
    ciphertext: props.ciphertext,
    senderIndex: props.senderIndex,
    receiverIndex: props.receiverIndex,
    onSuccess: (message) => {
      result.value = 'success'
      isSuccess.value = true
      decryptedMessage.value = message
    },
    onFailure: () => {
      result.value = 'failure'
      isSuccess.value = false
      decryptedMessage.value = ''
    }
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* 提高z-index值，确保在最上层 */
  pointer-events: auto; /* 确保事件可以被捕获 */
}

.decrypt-modal {
  background-color: #0f172a;
  border-radius: 8px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  border: 1px solid #1e40af;
  overflow: hidden;
  color: #e2e8f0;
  position: relative; /* 确保定位正确 */
  z-index: 10001; /* 比overlay更高一层 */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(to right, #1e3a8a, #1e40af);
  border-bottom: 1px solid #1e40af;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.satellite-info,
.cipher-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 14px;
  color: #94a3b8;
}

.info-value {
  font-size: 16px;
  color: #e2e8f0;
  font-weight: 500;
}

.cipher-text {
  padding: 10px;
  background-color: #1e293b;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  max-height: 80px;
  overflow-y: auto;
  border: 1px solid #334155;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  min-width: 120px;
}

.decrypt-btn {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
}

.decrypt-btn:hover {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
}

.decryption-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 5px;
}

.result-status {
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}

.result-status.success {
  background-color: rgba(5, 150, 105, 0.2);
  color: #34d399;
  border: 1px solid #059669;
}

.result-status.error {
  background-color: rgba(220, 38, 38, 0.2);
  color: #f87171;
  border: 1px solid #dc2626;
}

.decrypted-message {
  margin-top: 5px;
}

.message-text {
  padding: 10px;
  background-color: rgba(5, 150, 105, 0.1);
  border-radius: 6px;
  font-size: 16px;
  color: #10b981;
  border: 1px solid #059669;
  margin-top: 5px;
}
</style>