<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="query-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ satelliteIndex >= 0 ? `卫星 ${satelliteIndex + 1} - 数据查询` : '数据查询' }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-content">
        <div class="query-input-section">
          <label for="queryInput">请输入查询条件：</label>
          <input
            id="queryInput"
            v-model="queryTextModel"
            type="text"
            placeholder="输入要查询的数据..."
            class="query-input"
            @keyup.enter="$emit('query')"
          />
          
          <!-- 区块区间选择 -->
          <div class="block-range-section">
            <label class="range-main-label">区块区间查询：</label>
            <div class="range-inputs-row">
              <div class="range-input-container">
                <label for="blockStart" class="range-label">起始区块</label>
                <input 
                  id="blockStart"
                  v-model.number="blockStartModel"
                  type="number"
                  class="range-input"
                  :min="1"
                  :max="totalBlocks"
                  :placeholder="totalBlocks > 0 ? '1' : '请先上传文件'"
                  :disabled="totalBlocks === 0"
                />
              </div>
              <span class="range-separator">至</span>
              <div class="range-input-container">
                <label for="blockEnd" class="range-label">结束区块</label>
                <input 
                  id="blockEnd"
                  v-model.number="blockEndModel"
                  type="number"
                  class="range-input"
                  :min="blockStart"
                  :max="totalBlocks"
                  :placeholder="totalBlocks > 0 ? totalBlocks.toString() : '请先上传文件'"
                  :disabled="totalBlocks === 0"
                />
              </div>
            </div>
          </div>
          
          <button class="submit-query-btn" @click="$emit('query')">
            提交查询
          </button>
        </div>
        <div class="query-results-section">
          <h4>查询结果：</h4>
          <div class="results-container">
            <div v-if="loading" class="loading">查询中...</div>
            <div v-else-if="results.length === 0" class="no-results">
              暂无查询结果
            </div>
            <div v-else class="results-list">
              <div
                v-for="(result, index) in results"
                :key="index"
                class="result-item"
              >
                {{ result }}
              </div>
              
              <!-- 密文显示区域 -->
              <div v-if="ciphertext" class="ciphertext-section">
                <div class="ciphertext-item">
                  <strong>🔐 区块ID集密文 (16进制):</strong>
                </div>
                <div class="ciphertext-value">
                  {{ ciphertext }}
                </div>
              </div>
              
              <!-- 查询时间显示 -->
              <div class="query-time-section">
                <div class="query-time-item">
                  ⏱️ 查询耗时: {{ queryTime }} 秒
                </div>
              </div>
              
              <!-- 解密验证按钮 -->
              <div v-if="ciphertext" class="decrypt-section">
                <button 
                  class="decrypt-btn" 
                  @click="$emit('decrypt')"
                  :disabled="decrypting"
                >
                  <span v-if="decrypting">🔄 解密验证中...</span>
                  <span v-else>🔓 解密并验证</span>
                </button>
              </div>
              
              <!-- 解密结果显示 -->
              <div v-if="decryptionResult" class="decryption-result">
                <div class="decryption-title">
                  <strong>解密验证结果:</strong>
                </div>
                <div class="decryption-content">
                  {{ decryptionResult }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  satelliteIndex: {
    type: Number,
    default: -1
  },
  queryText: {
    type: String,
    default: ''
  },
  blockStart: {
    type: Number,
    default: null
  },
  blockEnd: {
    type: Number,
    default: null
  },
  totalBlocks: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  results: {
    type: Array,
    default: () => []
  },
  ciphertext: {
    type: String,
    default: ''
  },
  queryTime: {
    type: Number,
    default: 0
  },
  decrypting: {
    type: Boolean,
    default: false
  },
  decryptionResult: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'query', 'decrypt', 'update:queryText', 'update:blockStart', 'update:blockEnd'])

// 使用计算属性来实现双向绑定
const queryTextModel = computed({
  get: () => props.queryText,
  set: (value) => emit('update:queryText', value)
})

const blockStartModel = computed({
  get: () => props.blockStart,
  set: (value) => emit('update:blockStart', value)
})

const blockEndModel = computed({
  get: () => props.blockEnd,
  set: (value) => emit('update:blockEnd', value)
})
</script>

<style scoped>
/* Modal Styles */
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

.query-modal {
  background: rgba(31, 41, 55, 0.95);
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.6);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(75, 85, 99, 0.6);
}

.modal-header h3 {
  margin: 0;
  color: #f3f4f6;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #f3f4f6;
  background: rgba(75, 85, 99, 0.6);
}

.modal-content {
  padding: 24px;
}

.query-input-section {
  margin-bottom: 24px;
}

.query-input-section label {
  display: block;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.query-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.8);
  border-radius: 8px;
  color: #f3f4f6;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.query-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  background: rgba(55, 65, 81, 1);
}

.query-input::placeholder {
  color: #9ca3af;
}

.submit-query-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.submit-query-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.query-results-section h4 {
  color: #f3f4f6;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.results-container {
  background: rgba(17, 24, 39, 0.6);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(75, 85, 99, 0.6);
}

.loading {
  text-align: center;
  color: #60a5fa;
  font-size: 1rem;
  padding: 20px;
}

.no-results {
  text-align: center;
  color: #9ca3af;
  font-size: 1rem;
  padding: 20px;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

/* 美化滚动条样式 */
.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.6);
  border-radius: 4px;
}

.results-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

/* 为整个模态框也添加滚动条美化 */
.query-modal::-webkit-scrollbar {
  width: 10px;
}

.query-modal::-webkit-scrollbar-track {
  background: rgba(17, 24, 39, 0.8);
  border-radius: 5px;
}

.query-modal::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #374151, #4b5563);
  border-radius: 5px;
  transition: all 0.3s ease;
}

.query-modal::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #4b5563, #6b7280);
  box-shadow: 0 0 8px rgba(75, 85, 99, 0.4);
}

.result-item {
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 4px 0;
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
}

.result-item:last-child {
  border-bottom: none;
}

/* 区块区间查询样式 */
.block-range-section {
  margin: 20px 0;
  padding: 16px;
  background: rgba(55, 65, 81, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(75, 85, 99, 0.6);
}

.range-main-label {
  display: block;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.range-inputs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.range-input-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.range-label {
  color: #d1d5db;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 6px;
  white-space: nowrap;
}

.range-input {
  width: 100%;
  padding: 8px 10px;
  background: rgba(31, 41, 55, 0.9);
  border: 1px solid rgba(75, 85, 99, 0.8);
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.range-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  background: rgba(31, 41, 55, 1);
}

.range-input::placeholder {
  color: #9ca3af;
}

.range-input:disabled {
  background: rgba(17, 24, 39, 0.8);
  border-color: rgba(55, 65, 81, 0.6);
  color: #6b7280;
  cursor: not-allowed;
}

.range-input:disabled::placeholder {
  color: #6b7280;
}

.range-separator {
  color: #d1d5db;
  font-weight: 600;
  font-size: 1rem;
  padding: 0 8px;
  margin-top: 20px;
  flex-shrink: 0;
}



/* 密文显示样式 */
.ciphertext-section {
  margin-top: 16px;
  padding: 12px;
  background: rgba(55, 65, 81, 0.6);
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.ciphertext-item {
  color: #f3f4f6;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.ciphertext-value {
  color: #fbbf24;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  word-break: break-all;
  line-height: 1.4;
  background: rgba(31, 41, 55, 0.8);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(75, 85, 99, 0.6);
}

/* 查询时间样式 */
.query-time-section {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(31, 41, 55, 0.6);
  border-radius: 6px;
  border-left: 3px solid #10b981;
}

.query-time-item {
  color: #d1d5db;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 解密按钮样式 */
.decrypt-section {
  margin-top: 16px;
  text-align: center;
}

.decrypt-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.decrypt-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.decrypt-btn:disabled {
  background: rgba(75, 85, 99, 0.6);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 解密结果样式 */
.decryption-result {
  margin-top: 16px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.decryption-title {
  color: #10b981;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.decryption-content {
  color: #d1d5db;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-line;
  background: rgba(31, 41, 55, 0.8);
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(75, 85, 99, 0.6);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .range-inputs-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .range-separator {
    align-self: center;
    margin: 0;
    padding: 8px 0;
  }
}
</style>