<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="broadcast-modal" @click.stop>
      <div class="modal-header">
        <h3>广播消息</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      <div class="modal-content">
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
          <div class="cipher-text" v-html="formattedCiphertext"></div>
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

// 关闭模态框
const closeModal = () => {
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

// 格式化密文显示，支持多行
const formattedCiphertext = computed(() => {
  if (!ciphertext.value) return ''
  // 将换行符替换为HTML换行标签
  return ciphertext.value.split('\n').join('<br>')
})

// 监听visible变化，重置状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 打开模态框时重置状态
    selectedReceiver.value = -1
    message.value = ''
    ciphertext.value = ''
    result.value = ''
  }
})

// 加密消息
const encryptMessage = () => {
  emit('encrypt', {
    senderIndex: props.satelliteIndex,
    receiverIndex: selectedReceiver.value,
    message: message.value,
    onSuccess: (cipher) => {
      ciphertext.value = cipher
      result.value = `✅ 卫星${props.satelliteIndex + 1} 成功加密消息"${message.value}"，准备发送给 卫星${selectedReceiver.value + 1}`
    }
  })
}

// 广播消息
const broadcastMessage = () => {
  emit('broadcast', {
    senderIndex: props.satelliteIndex,
    receiverIndex: selectedReceiver.value,
    ciphertext: ciphertext.value
  })
  result.value = `📡 密文已从卫星${props.satelliteIndex + 1} 广播到所有卫星`
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

.broadcast-modal {
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

.sender-info,
.receiver-selection,
.message-input {
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

.receiver-select {
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 14px;
  width: 100%;
}

.message-field {
  padding: 10px 12px;
  border-radius: 6px;
  background-color: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 14px;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.action-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  flex: 1;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.encrypt-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.encrypt-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #059669);
}

.broadcast-btn {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
}

.broadcast-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.cipher-result {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 5px;
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

.operation-result {
  margin-top: 10px;
  padding: 10px;
  background-color: #1e293b;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}
</style>