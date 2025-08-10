<template>
  <div class="communication-control">
    <div class="control-container">
      <div class="control-label">{{ communicationEnabled ? '通信已开启' : '通信已关闭' }}</div>
      <ToggleSwitch 
        v-model="communicationEnabled" 
        @change="toggleCommunication" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

const props = defineProps({
  initialState: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:communicationMode', 'communicationToggled'])

const communicationEnabled = ref(props.initialState)

const toggleCommunication = (value) => {
  communicationEnabled.value = value
  emit('update:communicationMode', value)
  emit('communicationToggled', value)
}
</script>

<style scoped>
.communication-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px;
}

.control-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid #374151;
  border-radius: 10px;
  padding: 8px 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.control-label {
  color: #f9fafb;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>