<template>
  <div class="toggle-switch" :class="{ 'active': modelValue }" @click="toggle">
    <div class="toggle-switch-circle"></div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
  emit('change', !props.modelValue)
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  background-color: rgba(31, 41, 55, 0.9);
  border-radius: 34px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #374151;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  padding: 2px;
}

.toggle-switch.active {
  background-color: rgba(37, 99, 235, 0.9);
  border-color: #60a5fa;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
}

.toggle-switch-circle {
  position: absolute;
  left: 2px;
  width: 22px;
  height: 22px;
  background-color: #f9fafb;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-switch.active .toggle-switch-circle {
  left: calc(100% - 24px);
  background-color: #ffffff;
}
</style>