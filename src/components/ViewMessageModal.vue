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
              <div class="info-label">接收到的密文：<span class="timestamp">{{ formatTime(getMessageTimestamp(message)) }}</span></div>
              <div class="cipher-list">
                <!-- 改为逐字符高亮：仅在解密且检测到篡改/注入时对字符着色；未篡改/注入则在整块展示绿色背景 -->
                <div
                  v-for="(seg, li) in getLinesWithOffsets(message.ciphertext)"
                  :key="li"
                  class="cipher-item"
                  :class="{
                    'post-decrypt-green': activeMessageIndex === index && result && (!tamperDetected && !injectionDetected || !hasDiff),
                  }"
                >
                  <template v-if="activeMessageIndex === index && (tamperDetected || injectionDetected) && result && hasDiff">
                    <span v-for="(ch, ci) in seg.text.split('')" :key="ci" :class="getCharClass(seg.start + ci)">{{ ch }}</span>
                  </template>
                  <template v-else>
                    {{ seg.text }}
                  </template>
                  <!-- 新增：每个密文段下方一一对应显示解密后的明文（在有结果时） -->
                  <div v-if="activeMessageIndex === index && result && perLinePlainMap.get(message)" class="plainline">
                    <span class="plain-label">解密后：</span>
                    <span class="plain-text">{{ perLinePlainMap.get(message)[li] || '' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="activeMessageIndex === index && (tamperDetected || injectionDetected) && result && hasDiff" class="tamper-tip">
                （监测到密文被{{ tamperDetected ? '篡改' : '注入' }}）
              </div>
            </div>

            <div class="action-buttons">
              <button class="decrypt-button" @click="selectAndDecryptMessage(index, message)">🔓 解密</button>
            </div>

            <div class="decryption-result" v-if="activeMessageIndex === index && result">
              <div class="result-status" :class="{ success: isSuccess, error: !isSuccess }">
                {{ resultIcon }} {{ resultStatus }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import satelliteEncryptionService from '../services/SatelliteEncryptionService'


// 新增：保留换行分隔符长度，计算每个行段在原始字符串中的起始偏移
const getLinesWithOffsets = (text) => {
  const t = text || ''
  if (!t) return []
  const parts = t.split(/(\n)/)
  const res = []
  let offset = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part === '\n') {
      offset += 1 // 计入分隔符长度
    } else if (part && part.length > 0) {
      res.push({ text: part, start: offset })
      offset += part.length
    }
  }
  return res
}

const props = defineProps({
  visible: { type: Boolean, default: false },
  satelliteIndex: { type: Number, default: -1 },
  messages: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'message-decrypted', 'close'])

// 解密相关状态
const activeMessageIndex = ref(-1)
const result = ref('')
const isSuccess = ref(false)
const decryptedMessage = ref('')
const tamperDetected = ref(false)
const injectionDetected = ref(false)
// 新增：每条消息对应的逐行明文缓存（Map<messageObj, string[]>)
const perLinePlainMap = ref(new Map())

// 逐字符高亮所需：当前选中消息的差异索引集合
const activeDiffSet = ref(new Set())
const isDiffIndex = (idx) => activeDiffSet.value && activeDiffSet.value.has(idx)
// 是否存在实际差异（用于收紧 UI 呈现条件）
const hasDiff = ref(false)
// 区分篡改与注入的逐字符样式选择
const getCharClass = (globalIdx) => {
  if (!hasDiff.value) return ''
  if (!isDiffIndex(globalIdx)) return ''
  return tamperDetected.value ? 'tampered-text' : 'injected-text'
}
// 计算结果状态文本
const resultStatus = computed(() => {
  const currentMessage = activeMessageIndex.value >= 0 ? props.messages[activeMessageIndex.value] : null
  if (isSuccess.value) {
    if (currentMessage?.senderIndex === props.satelliteIndex) {
      return '解密成功（当前消息由您发送）'
    }
    // 修改：体现具体卫星有解密权限
    const receiverSat = (currentMessage?.receiverIndex ?? -1) + 1
    const senderSat = (currentMessage?.senderIndex ?? -1) + 1
    const who = currentMessage?.receiverIndex === props.satelliteIndex ? `卫星 ${receiverSat}` : `卫星 ${senderSat}`
    return `解密成功（${who}拥有解密权限）`
  } else {
    if (currentMessage?.isTampered) {
      return '解密失败：检测到密文被篡改'
    } else if (currentMessage?.isInjected) {
      return '解密失败：检测到密文被注入'
    }
    const currentSat = (props.satelliteIndex ?? -1) + 1
    return `解密失败：卫星 ${currentSat} 没有该消息的解密权限`
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
  if (activeMessageIndex.value === index) {
    resetDecryptionState()
  } else {
    activeMessageIndex.value = index
    decryptMessage(message)
  }
}

// 计算差异索引：支持篡改（字符更改）与注入（原文前缀 + 追加）
// 计算差异索引：
// - 注入：只标记“新增”的字符（原文是 current 的子序列）
// - 篡改：按位比较，标记不同位置
const computeDiffIndices = (original, current, { isInjected = false, isTampered = false } = {}) => {
  const set = new Set()
  const a = original || ''
  const b = current || ''
  if (!a) return set

  if (isInjected && !isTampered) {
    // 使用 LCS 计算新增字符，保证注入段连续高亮
    const m = a.length
    const n = b.length
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
    const matchedB = new Set()
    let i = m, j = n
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        matchedB.add(j - 1)
        i--
        j--
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }
    for (let k = 0; k < n; k++) {
      if (!matchedB.has(k)) set.add(k)
    }
    return set
  }

  // 篡改：以最小连续窗口标注差异，避免窗口内部的偶然相等字符造成断点
  let l = 0
  while (l < a.length && l < b.length && a[l] === b[l]) l++
  let ia = a.length - 1
  let ib = b.length - 1
  while (ia >= l && ib >= l && a[ia] === b[ib]) { ia--; ib-- }
  if (ib >= l) {
    for (let k = l; k <= ib; k++) set.add(k)
  }
  return set
}

// 解密消息
const decryptMessage = async (message) => {
  try {
    // 使用消息对象上的标记
    const isTampered = message.isTampered === true
    const isInjected = message.isInjected === true

    tamperDetected.value = !!isTampered
    injectionDetected.value = !!isInjected

    // 计算需要高亮的全局索引集合，仅在检测到异常时计算
    const originalCiphertext = message.originalCiphertext || ''
    activeDiffSet.value = (isTampered || isInjected)
      ? computeDiffIndices(originalCiphertext, message.ciphertext, { isInjected, isTampered })
      : new Set()
    hasDiff.value = (isTampered || isInjected) && activeDiffSet.value.size > 0

    // 请求解密
    const decryptResult = await satelliteEncryptionService.decryptMessage({
      satelliteIndex: props.satelliteIndex,
      ciphertext: message.ciphertext,
      senderIndex: message.senderIndex,
      receiverIndex: message.receiverIndex
    })

    if (decryptResult.success) {
      result.value = 'success'
      isSuccess.value = true
      decryptedMessage.value = decryptResult.message
      // 存储逐行明文，用于一一对应显示
      perLinePlainMap.value.set(message, decryptResult.lines || [decryptResult.message])
    } else {
      result.value = 'failure'
      isSuccess.value = false
      decryptedMessage.value = ''
      perLinePlainMap.value.delete(message)
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

// 新增：获取消息时间戳（优先从服务的元数据中读取）
const getMessageTimestamp = (message) => {
  const meta = satelliteEncryptionService.getMessageMetadata(message?.ciphertext || '')
  return meta?.timestamp || message?.timestamp || null
}

// 新增：时间格式化
const formatTime = (ts) => {
  if (!ts) return '未知时间'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 重置解密状态
const resetDecryptionState = () => {
  activeMessageIndex.value = -1
  result.value = ''
  isSuccess.value = false
  decryptedMessage.value = ''
  tamperDetected.value = false
  injectionDetected.value = false
  activeDiffSet.value = new Set()
  hasDiff.value = false
  perLinePlainMap.value.clear()
}

// 关闭
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
  background: rgba(17, 24, 39, 0.95);
  border-radius: 12px;
  width: 90%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.modal-header h3 {
  color: #e5e7eb;
  font-size: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
}

.modal-content {
  padding: 14px;
}

.satellite-info {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
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

.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-item {
  padding: 10px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.cipher-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cipher-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px; /* 恢复更紧凑但清晰的间距 */
}

.cipher-item {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.55; /* 增加行高，减轻拥挤感 */
  letter-spacing: 0.2px; /* 微调字距提高易读性 */
  padding: 10px; /* 恢复原有内边距，保证密文不显拥挤 */
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.65); /* 恢复原先对比度更高的背景 */
  border: 1px solid rgba(148, 163, 184, 0.30); /* 细边框 */
  color: #e5e7eb; /* 明亮文本色以增强对比 */
  word-break: break-all;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.cipher-item:hover {
  background: rgba(51, 65, 85, 0.72); /* 略微提亮的 hover */
  border-color: rgba(148, 163, 184, 0.35);
}

/* 被标记差异字符：增加轻微底色帮助在深色背景下识别 */
.tampered-text {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.10);
  border-radius: 3px;
  padding: 0 1px;
  font-weight: 500; /* 保持排版稳定 */
}
/* 新增：操作区与解密按钮样式，统一与其它弹窗风格 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}

.decrypt-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  min-width: 120px;
  color: #fff;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 6px 12px rgba(220, 38, 38, 0.15);
}

.decrypt-button:hover {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(220, 38, 38, 0.25);
}

/* 正常未被篡改/注入：绿色背景 */
.post-decrypt-green {
  background: rgba(16, 185, 129, 0.12) !important;
  border-color: rgba(16, 185, 129, 0.35) !important;
}

/* 被标记差异字符：仅变色，不加粗，避免破坏等宽排版 */
.tampered-text {
  color: #ef4444;
  font-weight: 500; /* 去掉 700 粗体，保持视觉稳定 */
}
.tamper-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
  opacity: 0.9;
}

.decryption-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
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

/* 被标记差异字符：红色字体 */
.tampered-text {
  color: #ef4444;
  font-weight: 700;
}
/* 注入差异字符：采用琥珀色弱高亮，避免与篡改混淆 */
.injected-text {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 3px;
  padding: 0 1px;
  font-weight: 500;
}
.plainline {
  margin-top: 6px;
  padding: 6px 8px;
  border-left: 3px solid rgba(16, 185, 129, 0.6);
  background: rgba(2, 6, 23, 0.35);
  border-radius: 6px;
}
.plain-label {
  color: #94a3b8;
  font-size: 12px;
  margin-right: 6px;
}
.plain-text {
  font-family: monospace;
  color: #e5e7eb;
  font-size: 12px;
  margin-left: 6px;
  font-size: 12px;
  color: #cbd5e1;
  opacity: 0.85;
}
</style>