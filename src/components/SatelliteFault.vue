<template>
  <div class="satellite-fault-component">
    <!-- 这个组件主要用于管理卫星故障状态和恶意状态 -->
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
  emits: ['satellite-fault-changed', 'satellite-unkind-changed'],
  setup(props, { emit }) {
    // 卫星故障状态管理
    const faultySatellites = ref(new Set())
    // 恶意卫星状态管理
    const unkindSatellite = ref(undefined) // undefined表示没有恶意卫星
    
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
    
    // 设置卫星为恶意状态
    const setSatelliteUnkind = (satelliteIndex, isUnkind) => {
      if (isUnkind) {
        // 如果设置为恶意，先清除之前的恶意卫星
        unkindSatellite.value = satelliteIndex
      } else if (unkindSatellite.value === satelliteIndex) {
        // 只有当前恶意卫星才能被设置为非恶意
        unkindSatellite.value = undefined
      }
      
      // 触发事件通知父组件
      emit('satellite-unkind-changed', {
        satelliteIndex,
        isUnkind,
        unkindSatellite: unkindSatellite.value
      })
    }
    
    // 切换卫星恶意状态
    const toggleSatelliteUnkind = (satelliteIndex) => {
      const isUnkind = unkindSatellite.value === satelliteIndex
      setSatelliteUnkind(satelliteIndex, !isUnkind)
      console.log('切换卫星恶意状态:', satelliteIndex, '新状态:', !isUnkind, 'unkindSatellite值:', unkindSatellite.value)
    }
    
    // 检查卫星是否恶意
    const isSatelliteUnkind = (satelliteIndex) => {
      return unkindSatellite.value === satelliteIndex
    }
    
    // 检查是否可以将卫星设置为恶意状态
    const canSetSatelliteUnkind = (satelliteIndex) => {
      // 如果当前没有恶意卫星，或者当前卫星就是恶意卫星，则可以设置
      return unkindSatellite.value === undefined || unkindSatellite.value === satelliteIndex
    }
    
    // 获取卫星图片路径
    const getSatelliteImagePath = (satelliteIndex) => {
      if (isSatelliteUnkind(satelliteIndex)) {
        return require('../assets/satellite_unkind.jpg')
      } else if (isSatelliteFaulty(satelliteIndex)) {
        return require('../assets/satellite_error.jpg')
      } else {
        return require('../assets/satellite.jpg')
      }
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
      faultySatelliteCount,
      unkindSatellite,
      setSatelliteUnkind,
      toggleSatelliteUnkind,
      isSatelliteUnkind,
      canSetSatelliteUnkind
    }
  }
}
</script>

<style scoped>
.satellite-fault-component {
  /* 这个组件主要提供逻辑功能，不需要特殊样式 */
}
</style>