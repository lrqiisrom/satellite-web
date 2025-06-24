<template>
  <div class="satellite-input">
    <!-- Starry background -->
    <div class="starry-background">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
    </div>
    
    <!-- Input form -->
    <div class="input-container">
      <div class="input-form">
        <h1 class="title">卫星通信系统</h1>
        <p class="subtitle">请输入卫星节点数量</p>
        
        <div class="form-group">
          <label for="satelliteCount">卫星数量：</label>
          <input 
            id="satelliteCount"
            v-model.number="satelliteCount" 
            type="number" 
            min="3" 
            max="12" 
            placeholder="请输入3-12之间的数字"
            class="satellite-input-field"
            @keyup.enter="submitForm"
          />
        </div>
        
        <button 
          @click="submitForm" 
          :disabled="!isValidCount"
          class="submit-btn"
        >
          生成卫星系统
        </button>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'

const emit = defineEmits(['submit'])

const satelliteCount = ref(4)
const errorMessage = ref('')

const isValidCount = computed(() => {
  return satelliteCount.value >= 3 && satelliteCount.value <= 12
})

const submitForm = () => {
  if (!isValidCount.value) {
    errorMessage.value = '请输入3-12之间的数字'
    return
  }
  
  errorMessage.value = ''
  emit('submit', satelliteCount.value)
}
</script>

<style scoped>
.satellite-input {
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Starry Background */
.starry-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 50s linear infinite;
}

.stars:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
    radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
  background-repeat: repeat;
  background-size: 200px 100px;
}

.stars2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 100s linear infinite;
}

.stars2:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 25px 25px, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 50px 75px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 125px 45px, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 175px 85px, rgba(255,255,255,0.6), transparent);
  background-repeat: repeat;
  background-size: 300px 150px;
}

.stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: animateStars 150s linear infinite;
}

.stars3:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 10px 10px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 150px 150px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 60px 170px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 175px 30px, rgba(255,255,255,0.3), transparent),
    radial-gradient(2px 2px at 195px 195px, rgba(255,255,255,0.4), transparent);
  background-repeat: repeat;
  background-size: 400px 200px;
}

@keyframes animateStars {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
}

/* Input Form Styles */
.input-container {
  position: relative;
  z-index: 10;
}

.input-form {
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid #374151;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 
    0 25px 50px rgba(0,0,0,0.7),
    0 0 30px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  text-align: center;
  min-width: 400px;
  animation: formFadeIn 0.8s ease-out;
}

@keyframes formFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.title {
  color: #f9fafb;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6, #1e40af);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #d1d5db;
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.8;
}

.form-group {
  margin-bottom: 25px;
  text-align: left;
}

label {
  display: block;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.satellite-input-field {
  width: 100%;
  padding: 15px 20px;
  font-size: 1.1rem;
  border: 2px solid #374151;
  border-radius: 12px;
  background: rgba(31, 41, 55, 0.8);
  color: #f9fafb;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.satellite-input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  background: rgba(31, 41, 55, 0.9);
}

.satellite-input-field::placeholder {
  color: #9ca3af;
}

.submit-btn {
  width: 100%;
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #1e40af, #1e3a8a);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa, #3b82f6, #1e40af);
  box-shadow: 0 6px 25px rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

.error-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}
</style>