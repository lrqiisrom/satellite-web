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
          <div class="cipher-list">
            <div v-for="(line, idx) in ciphertextLines" :key="idx" class="cipher-row">
              <input type="checkbox" class="cipher-checkbox" :value="idx" v-model="selectedIndices" />
              <div class="cipher-item" :class="{ selected: selectedIndices.includes(idx) }">{{ line }}</div>
            </div>
          </div>
        </div>
        
        <div class="intercept-actions">
          <button class="action-btn tamper-btn" @click="handleTamperMessage">拦截篡改</button>
          <button class="action-btn inject-btn" @click="handleInjectMessage">拦截注入</button>
        </div>
        <div class="selection-tip" v-if="selectionTip">{{ selectionTip }}</div>
        
        <div v-if="tamperedCiphertext" class="cipher-display">
          <div class="info-label">篡改后密文:</div>
          <div class="cipher-list">
            <div
              v-for="(line, li) in splitCiphertext(tamperedCiphertext)"
              :key="li"
              class="cipher-item"
            >
              <span v-for="(char, index) in line.split('')" :key="index"
                :class="{ 'tampered-text': isTamperedChar(getGlobalCharIndex(tamperedCiphertext, li, index)) }">
                {{ char }}
              </span>
            </div>
          </div>
          <button class="action-btn send-btn" @click="sendTamperedMessage">篡改后发送</button>
        </div>
        
        <div v-if="injectedCiphertext" class="cipher-display">
          <div class="info-label">注入后密文:</div>
          <div class="cipher-list">
            <div
              v-for="(line, li) in splitCiphertext(injectedCiphertext)"
              :key="li"
              class="cipher-item"
            >
              <span v-for="(char, index) in line.split('')" :key="index"
                :class="{ 'injected-text': isInjectedChar(getGlobalCharIndex(injectedCiphertext, li, index)) }">
                {{ char }}
              </span>
            </div>
          </div>
          <button class="action-btn send-btn" @click="sendInjectedMessage">注入后发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'

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
const selectedIndices = ref([]) // 多选的密文块索引
const selectionTip = ref('')

// 处理篡改消息（仅对选中的块生效）
const HEX_CHARS = '0123456789abcdef'
// 生成一个随机十六进制字符（0-9, a-f）
const randomHexChar = () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]

// 将任意密文按与原始相同的规则拆分用于卡片展示
const splitCiphertext = (text) => {
  const t = text || ''
  if (!t.trim()) return []
  if (/\s/.test(t)) return t.split(/\s+/).filter(s => s.trim().length > 0)
  const size = 64
  const res = []
  for (let i = 0; i < t.length; i += size) res.push(t.slice(i, i + size))
  return res
}

// 计算某卡片内字符在整体字符串中的全局索引，用于高亮
const getGlobalCharIndex = (fullText, lineIndex, charIndex) => {
  const t = fullText || ''
  if (/\s/.test(t)) {
    const parts = t.split(/(\s+)/)
    let offset = 0
    let tokenIdx = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (/^\s+$/.test(part)) {
        offset += part.length
      } else {
        if (tokenIdx === lineIndex) {
          return offset + charIndex
        }
        offset += part.length
        tokenIdx++
      }
    }
    // 兜底：若未命中行索引，返回最后位置加上字符索引
    return offset + charIndex
  }
  // 无空白：按固定分块累计
  const lines = splitCiphertext(t)
  let base = 0
  for (let i = 0; i < lineIndex; i++) base += lines[i].length
  return base + charIndex
}

const handleTamperMessage = () => {
  if (!selectedIndices.value.length) {
    selectionTip.value = '请先勾选要处理的密文块'
    return
  }
  selectionTip.value = ''
  tamperedIndices.value = []

  const text = props.ciphertext || ''
  let output = ''
  let offset = 0

  if (/\s/.test(text)) {
    const parts = text.split(/(\s+)/)
    let tokenIdx = 0

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        output += part
        offset += part.length
      } else {
        if (selectedIndices.value.includes(tokenIdx)) {
          const chars = part.split('')
          const startIndex = Math.min(7, Math.max(0, chars.length - 1))
          const endIndex = Math.min(15, chars.length - 1)
          for (let i = startIndex; i <= endIndex; i++) {
            tamperedIndices.value.push(offset + i)
            chars[i] = randomHexChar()
          }
          const modified = chars.join('')
          output += modified
          offset += modified.length
        } else {
          output += part
          offset += part.length
        }
        tokenIdx++
      }
    })
  } else {
    const lines = ciphertextLines.value
    lines.forEach((chunk, idx) => {
      if (selectedIndices.value.includes(idx)) {
        const chars = chunk.split('')
        const startIndex = Math.min(7, Math.max(0, chars.length - 1))
        const endIndex = Math.min(15, chars.length - 1)
        for (let i = startIndex; i <= endIndex; i++) {
          tamperedIndices.value.push(offset + i)
          chars[i] = randomHexChar()
        }
        const modified = chars.join('')
        output += modified
        offset += modified.length
      } else {
        output += chunk
        offset += chunk.length
      }
    })
  }

  tamperedCiphertext.value = output
}

// 处理注入消息（仅对选中的块生效）
const handleInjectMessage = () => {
  if (!selectedIndices.value.length) {
    selectionTip.value = '请先勾选要处理的密文块'
    return
  }
  selectionTip.value = ''
  injectedIndices.value = []

  const text = props.ciphertext || ''
  let output = ''
  let offset = 0

  if (/\s/.test(text)) {
    const parts = text.split(/(\s+)/)
    let tokenIdx = 0

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        output += part
        offset += part.length
      } else {
        if (selectedIndices.value.includes(tokenIdx)) {
          let randomBytes = ''
          for (let i = 0; i < 8; i++) randomBytes += randomHexChar()
          const modified = part + randomBytes
          const start = offset + part.length
          for (let i = 0; i < randomBytes.length; i++) injectedIndices.value.push(start + i)
          output += modified
          offset += modified.length
        } else {
          output += part
          offset += part.length
        }
        tokenIdx++
      }
    })
  } else {
    const lines = ciphertextLines.value
    lines.forEach((chunk, idx) => {
      if (selectedIndices.value.includes(idx)) {
        let randomBytes = ''
        for (let i = 0; i < 8; i++) randomBytes += randomHexChar()
        const modified = chunk + randomBytes
        const start = offset + chunk.length
        for (let i = 0; i < randomBytes.length; i++) injectedIndices.value.push(start + i)
        output += modified
        offset += modified.length
      } else {
        output += chunk
        offset += chunk.length
      }
    })
  }

  injectedCiphertext.value = output
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
  selectedIndices.value = []
  selectionTip.value = ''
  emit('update:visible', false)
  emit('close')
}

// 原始密文按空白字符分割为多行卡片（支持换行与空格）；若无空白，则按64字符分块
const ciphertextLines = computed(() => {
  const text = props.ciphertext || ''
  if (!text.trim()) return []
  if (/\s/.test(text)) {
    return text.split(/\s+/).filter(s => s.trim().length > 0)
  }
  const size = 64
  const res = []
  for (let i = 0; i < text.length; i += size) {
    res.push(text.slice(i, i + size))
  }
  return res
})
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

/* 原始密文：按行卡片展示 */
.cipher-list {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  background: rgba(51, 65, 85, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
}
.cipher-row { display: flex; align-items: center; gap: 12px; }
.cipher-checkbox {
  /* 统一尺寸与美化 */
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 0; /* 保证垂直居中 */
  border-radius: 6px;
  border: 2px solid rgba(148, 163, 184, 0.55);
  background: rgba(17, 24, 39, 0.35);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease;
  /* 自定义渲染，跨浏览器更一致 */
  appearance: none;
  -webkit-appearance: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.35);
  position: relative; /* 便于伪元素居中 */
}
.cipher-checkbox:hover {
  border-color: rgba(99, 102, 241, 0.8);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.cipher-checkbox:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}
.cipher-checkbox:active { transform: scale(0.95); }
.cipher-checkbox:checked {
  background: #6366f1; /* Tailwind indigo-500 */
  border-color: #6366f1;
}
.cipher-checkbox:checked::after {
  content: "✓"; /* 使用正确的 CSS 字符，避免显示 'u2713' */
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  line-height: 18px; /* 与复选框高度一致，保证垂直居中 */
  text-align: center;
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
.cipher-item.selected {
  background: rgba(67, 56, 202, 0.25);
  border-color: rgba(99, 102, 241, 0.6);
}

.selection-tip { color: #fca5a5; font-size: 12px; margin-top: -6px; margin-bottom: 8px; }

.cipher-list::-webkit-scrollbar { width: 6px; }
.cipher-list::-webkit-scrollbar-track { background: transparent; }
.cipher-list::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 6px; }
.cipher-list::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.9); }

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