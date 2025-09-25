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
          <div class="cipher-list">
            <div
              v-for="(seg, li) in getLinesWithOffsets(ciphertext)"
              :key="li"
              class="cipher-item"
              :class="{ 'post-decrypt-green': result && !props.isTampered && !props.isInjected }"
            >
              <template v-if="result && (props.isTampered || props.isInjected)">
                <span v-for="(ch, ci) in seg.text.split('')" :key="ci" :class="{ 'tampered-text': isDiffIndex(seg.start + ci) }">{{ ch }}</span>
              </template>
              <template v-else>
                {{ seg.text }}
              </template>
            </div>
          </div>
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
  visible: { type: Boolean, default: false },
  satelliteIndex: { type: Number, default: -1 },
  ciphertext: { type: String, default: '' },
  senderIndex: { type: Number, default: -1 },
  receiverIndex: { type: Number, default: -1 },
  isTampered: { type: Boolean, default: false },
  isInjected: { type: Boolean, default: false },
  originalCiphertext: { type: String, default: '' }
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

// 逐字符高亮：保存差异索引集合
const diffSet = ref(new Set())
const isDiffIndex = (idx) => diffSet.value.has(idx)

// 计算结果状态文本
const resultStatus = computed(() => {
  if (isSuccess.value) {
    return '✅ 有权解密，解密成功！密文未被篡改'
  } else {
    if (props.isTampered) return '密文被篡改，解密失败'
    if (props.isInjected) return '密文被注入，解密失败'
    const currentSat = (props.satelliteIndex ?? -1) + 1
    return `❌ 卫星 ${currentSat} 未被授予解密权限，解密失败！`
  }
})

// 将密文拆分为行并保留偏移
const getLinesWithOffsets = (text) => {
  const t = text || ''
  if (!t) return []
  const parts = t.split(/(\n)/)
  const res = []
  let offset = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part === '\n') {
      offset += 1
    } else if (part && part.length > 0) {
      res.push({ text: part, start: offset })
      offset += part.length
    }
  }
  return res
}

// 计算差异索引集合
const computeDiffIndices = (original, current) => {
  const set = new Set()
  const a = original || ''
  const b = current || ''
  if (!a) return set

  // 统一：注入使用 LCS，篡改使用“连续窗口”标注
  const m = a.length
  const n = b.length
  // LCS for injection is handled by caller in ViewMessageModal via flags
  // 这里仅实现篡改的连续窗口
  let l = 0
  while (l < m && l < n && a[l] === b[l]) l++
  let ia = m - 1
  let ib = n - 1
  while (ia >= l && ib >= l && a[ia] === b[ib]) { ia--; ib-- }
  if (ib >= l) {
    for (let k = l; k <= ib; k++) set.add(k)
  }
  return set
}

// 监听visible变化，重置状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    result.value = ''
    isSuccess.value = false
    decryptedMessage.value = ''
    diffSet.value = new Set()
  }
})

// 解密消息
const decryptMessage = () => {
  // 先计算差异索引，仅在标记为篡改或注入时
  const orig = props.originalCiphertext || ''
  if (props.isTampered || props.isInjected) {
    diffSet.value = computeDiffIndices(orig, props.ciphertext)
  } else {
    diffSet.value = new Set()
  }

  emit('decrypt', {
    satelliteIndex: props.satelliteIndex,
    ciphertext: props.ciphertext,
    senderIndex: props.senderIndex,
    receiverIndex: props.receiverIndex
  })
}
</script>

<style scoped>
/* 保持原有样式，并新增绿色背景与红色字符 */
.cipher-list { display: grid; grid-template-columns: 1fr; gap: 8px; }
.cipher-item { font-family: monospace; font-size: 12px; padding: 10px; border-radius: 8px; background: rgba(30,41,59,0.65); border: 1px solid rgba(148,163,184,0.3); word-break: break-all; }
.post-decrypt-green { background: rgba(16,185,129,0.12) !important; border-color: rgba(16,185,129,0.35) !important; }
.tampered-text { color: #ef4444; font-weight: 700; }
</style>

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