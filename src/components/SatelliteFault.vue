<template>
  <div class="satellite-fault-component">
    <!-- 这个组件主要用于管理卫星故障状态 -->
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'SatelliteFault',
  props: {
    satellites: {
      type: Array,
      required: true
    }
  },
  emits: ['satellite-fault-changed'],
  setup(props, { emit }) {
    // 卫星故障状态管理
    const faultySatellites = ref(new Set())
    
    // 设置卫星故障状态
    const setSatelliteFault = (satelliteIndex, isFaulty) => {
      if (isFaulty) {
        faultySatellites.value.add(satelliteIndex)
      } else {
        faultySatellites.value.delete(satelliteIndex)
      }
      
      // 触发事件通知父组件
      emit('satellite-fault-changed', {
        satelliteIndex,
        isFaulty,
        faultySatellites: Array.from(faultySatellites.value)
      })
    }
    
    // 切换卫星故障状态
    const toggleSatelliteFault = (satelliteIndex) => {
      const isFaulty = faultySatellites.value.has(satelliteIndex)
      setSatelliteFault(satelliteIndex, !isFaulty)
    }
    
    // 修复卫星（查询数据时调用）
    const repairSatellite = (satelliteIndex) => {
      if (faultySatellites.value.has(satelliteIndex)) {
        setSatelliteFault(satelliteIndex, false)
        return true // 返回true表示进行了修复
      }
      return false // 返回false表示卫星本来就正常
    }
    
    // 检查卫星是否故障
    const isSatelliteFaulty = (satelliteIndex) => {
      return faultySatellites.value.has(satelliteIndex)
    }
    
    // 获取卫星图片路径
    const getSatelliteImagePath = (satelliteIndex) => {
      return isSatelliteFaulty(satelliteIndex) 
        ? require('../assets/satellite_error.jpg')
        : require('../assets/satellite.jpg')
    }
    
    // 获取故障卫星数量
    const faultySatelliteCount = computed(() => {
      return faultySatellites.value.size
    })
    
    return {
      faultySatellites,
      setSatelliteFault,
      toggleSatelliteFault,
      repairSatellite,
      isSatelliteFaulty,
      getSatelliteImagePath,
      faultySatelliteCount
    }
  }
}
</script>

<style scoped>
.satellite-fault-component {
  /* 这个组件主要提供逻辑功能，不需要特殊样式 */
}
</style>