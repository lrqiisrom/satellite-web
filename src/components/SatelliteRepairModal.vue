<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="repair-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ satelliteIndex >= 0 ? `卫星 ${satelliteIndex + 1} - 故障修复` : '卫星修复' }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-content">
        <div class="repair-input-section">
          <div class="input-group">
            <label for="lossRate">损失率：</label>
            <input
              id="lossRate"
              v-model.number="lossRateModel"
              type="number"
              placeholder="输入损失率..."
              class="repair-input"
              :min="0"
              :max="100"
              step="0.1"
            />
          </div>
          
          <div class="input-group">
            <label for="redundancy">冗余度：</label>
            <input
              id="redundancy"
              v-model.number="redundancyModel"
              type="number"
              placeholder="输入冗余度..."
              class="repair-input"
              :min="1"
              step="1"
            />
          </div>
          
          <button 
            class="repair-btn" 
            @click="$emit('repair')"
            :disabled="!canRepair"
          >
            <span v-if="repairing">🔄 修复中...</span>
            <span v-else>🔧 开始修复</span>
          </button>
        </div>
        
        <div class="repair-results-section">
          <h4>修复结果：</h4>
          <div class="results-container">
            <div v-if="repairing" class="loading">修复中...</div>
            <div v-else-if="!repairResult" class="no-results">
              暂无修复结果
            </div>
            <div v-else class="repair-result">
              <div class="result-item">
                {{ repairResult }}
              </div>
              
              <!-- 修复时间显示 -->
              <div v-if="repairTime > 0" class="repair-time-section">
                <div class="repair-time-item">
                  ⏱️ 修复耗时: {{ repairTime }} 秒
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
  lossRate: {
    type: Number,
    default: null
  },
  redundancy: {
    type: Number,
    default: null
  },
  repairing: {
    type: Boolean,
    default: false
  },
  repairResult: {
    type: String,
    default: ''
  },
  repairTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'repair', 'update:lossRate', 'update:redundancy'])

// 使用计算属性来实现双向绑定
const lossRateModel = computed({
  get: () => props.lossRate,
  set: (value) => emit('update:lossRate', value)
})

const redundancyModel = computed({
  get: () => props.redundancy,
  set: (value) => emit('update:redundancy', value)
})

// 验证是否可以开始修复
const canRepair = computed(() => {
  return props.lossRate !== null && 
         props.redundancy !== null && 
         props.lossRate >= 0 && 
         props.redundancy >= 0 && 
         !props.repairing
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.repair-modal {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: #ffffff;
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-content {
  padding: 25px;
}

.repair-input-section {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #ffffff;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 1rem;
}

.repair-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.repair-input:focus {
  outline: none;
  border-color: #4CAF50;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

/* 隐藏 number input 的上下调节按钮 */
.repair-input::-webkit-outer-spin-button,
.repair-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.repair-input[type=number] {
  -moz-appearance: textfield;
}

.repair-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.repair-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.repair-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.repair-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.repair-results-section h4 {
  color: #ffffff;
  margin-bottom: 15px;
  font-size: 1.2rem;
  font-weight: 600;
}

.results-container {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading {
  color: #4CAF50;
  text-align: center;
  font-size: 1.1rem;
  padding: 20px;
}

.no-results {
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-style: italic;
  padding: 20px;
}

.repair-result {
  color: #ffffff;
}

.result-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 4px solid #4CAF50;
  line-height: 1.6;
  white-space: pre-line;
}

.repair-time-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.repair-time-item {
  color: #4CAF50;
  font-weight: 600;
  text-align: center;
  padding: 10px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6px;
}
</style>