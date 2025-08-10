<template>
  <div v-if="visible" class="modal-overlay" @click="close">
    <div class="intercept-modal" @click.stop>
      <div class="modal-header">
        <h3>拦截消息</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      <div class="modal-content">
        <div class="satellite-info">
          <div class="info-label">拦截卫星:</div>
          <div class="info-value">{{ interceptor === 0 ? '卫星 1' : (interceptor === -1 || interceptor === undefined ? '系统' : `卫星 ${interceptor + 1}`) }}</div>
        </div>
        <div class="satellite-info">
          <div class="info-label">发送方:</div>
          <div class="info-value">卫星 {{ sender + 1 }}</div>
        </div>
        <div class="satellite-info">
          <div class="info-label">接收方:</div>
          <div class="info-value">卫星 {{ receiver + 1 }}</div>
        </div>
        
        <div class="cipher-display">
          <div class="info-label">原始密文:</div>
          <div class="cipher-text">{{ ciphertext }}</div>
        </div>
        
        <div class="intercept-actions">
          <button class="action-btn tamper-btn" @click="handleTamperMessage">拦截篡改</button>
          <button class="action-btn inject-btn" @click="handleInjectMessage">拦截注入</button>
        </div>
        
        <div v-if="tamperedCiphertext" class="cipher-display">
          <div class="info-label">篡改后密文:</div>
          <div class="cipher-text">
            <span v-for="(char, index) in tamperedCiphertext.split('')" :key="index"
              :class="{ 'tampered-text': isTamperedChar(index) }">
              {{ char }}
            </span>
          </div>
          <button class="action-btn send-btn" @click="sendTamperedMessage">篡改后发送</button>
        </div>
        
        <div v-if="injectedCiphertext" class="cipher-display">
          <div class="info-label">注入后密文:</div>
          <div class="cipher-text">
            <span v-for="(char, index) in injectedCiphertext.split('')" :key="index"
              :class="{ 'injected-text': isInjectedChar(index) }">
              {{ char }}
            </span>
          </div>
          <button class="action-btn send-btn" @click="sendInjectedMessage">注入后发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  interceptor: {
    type: Number,
    default: undefined
  },
  sender: {
    type: Number,
    default: -1
  },
  receiver: {
    type: Number,
    default: -1
  },
  ciphertext: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'send-tampered', 'send-injected', 'close'])

// 拦截相关状态
const tamperedCiphertext = ref('')
const injectedCiphertext = ref('')
const tamperedIndices = ref([])
const injectedIndices = ref([])

// 处理篡改消息
const handleTamperMessage = () => {
  // 复制原始密文
  tamperedCiphertext.value = props.ciphertext
  // 篡改第8-15字节
  tamperedIndices.value = []
  const chars = tamperedCiphertext.value.split('')
  
  // 确定篡改范围（第8-15字节）
  const startIndex = 7 // 索引从0开始，所以第8字节是索引7
  const endIndex = Math.min(15, chars.length - 1) // 确保不超出密文长度
  
  // 记录被篡改的字节位置
  for (let i = startIndex; i <= endIndex; i++) {
    tamperedIndices.value.push(i)
    // 替换为随机字符
    chars[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  }
  
  tamperedCiphertext.value = chars.join('')
  // 不再自动调用发送篡改消息，让用户点击按钮发送
}

// 处理注入消息
const handleInjectMessage = () => {
  // 创建8字节随机数据附加至原密文末尾
  let randomBytes = ''
  // 生成8个随机字符
  for (let i = 0; i < 8; i++) {
    randomBytes += String.fromCharCode(65 + Math.floor(Math.random() * 26))
  }
  
  injectedCiphertext.value = props.ciphertext + randomBytes
  
  // 标记被注入的字节位置
  const originalLength = props.ciphertext.length
  injectedIndices.value = Array.from({ length: randomBytes.length }, (_, i) => originalLength + i)
  
  // 不再自动调用发送注入消息，让用户点击按钮发送
}

// 发送篡改后的消息
const sendTamperedMessage = () => {
  emit('send-tampered', {
    sender: props.sender,
    receiver: props.receiver,
    originalCiphertext: props.ciphertext,
    tamperedCiphertext: tamperedCiphertext.value
  })
  close()
}

// 发送注入的消息
const sendInjectedMessage = () => {
  emit('send-injected', {
    sender: props.sender,
    receiver: props.receiver,
    originalCiphertext: props.ciphertext,
    injectedCiphertext: injectedCiphertext.value
  })
  close()
}

// 判断字符是否被篡改
const isTamperedChar = (index) => {
  return tamperedIndices.value.includes(index)
}

// 判断字符是否被注入
const isInjectedChar = (index) => {
  return injectedIndices.value.includes(index)
}

// 关闭拦截模态框
const close = () => {
  tamperedCiphertext.value = ''
  injectedCiphertext.value = ''
  tamperedIndices.value = []
  injectedIndices.value = []
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
/* 模态框样式 */
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

/* 拦截模态框样式 */
.intercept-modal {
  background: rgba(17, 24, 39, 0.95);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
  border: 1px solid #374151;
  animation: modalFadeIn 0.3s ease;
}

.intercept-actions {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.action-btn {
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tamper-btn {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: white;
  border: 1px solid #b91c1c;
}

.inject-btn {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  border: 1px solid #6d28d9;
}

.send-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: 1px solid #059669;
  margin-top: 10px;
}

.tampered-text {
  color: red;
  font-weight: bold;
}

.injected-text {
  color: red;
  font-weight: bold;
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
  color: #94a3b8;
  font-weight: 500;
  margin-right: 10px;
}

.info-value {
  color: #f8fafc;
  font-weight: 600;
}

.cipher-display {
  margin-bottom: 15px;
}

.cipher-text {
  padding: 10px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  font-family: monospace;
  color: #94a3b8;
  margin-top: 5px;
  word-break: break-all;
  font-size: 0.9rem;
  max-height: 100px;
  overflow-y: auto;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>