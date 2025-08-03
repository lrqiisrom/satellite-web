<template>
  <div class="blockchain-visualizer" :style="{ width: calculateWidth + 'px' }">
    <!-- 卫星数量圆圈 -->
    <div class="satellite-header">
      <div v-for="index in satelliteCount" :key="index" class="satellite-circle-container">
        <!-- 卫星圆圈，恶意节点使用不同样式 -->
        <div class="satellite-circle" :class="{ 'malicious': isMaliciousSatellite(index) }" :data-index="index">
          <!-- 移除恶意节点图片，仅使用红色背景 -->
        </div>
      </div>
    </div>

    <!-- 区块链上链过程（统一滚动区域） -->
    <div class="blockchain-content" v-if="blocks.length > 0">
      <div class="blockchain-rows">
        <div v-for="(block, blockIndex) in blocks" :key="blockIndex" class="blockchain-row">
          <!-- 每个卫星对应的区块 -->
          <div v-for="index in satelliteCount" :key="index" class="satellite-block" :class="{ 
                 'active': block.active, 
                 'confirmed': block.confirmed,
                 'error-block': getSatelliteBlockStatus(index, blockIndex) === 'error',
                 'empty-block': getSatelliteBlockStatus(index, blockIndex) === 'empty'
               }">
            <!-- 区块连接线 -->
            <div v-if="blockIndex > 0" class="block-connector"></div>
            <!-- 显示加密数据的方框，根据卫星状态显示不同内容 -->
            <div class="encrypted-data-box">
              {{ getSatelliteBlockContent(index, blockIndex, block) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上链进度指示器已删除 -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
// 移除加密服务引用，使用内置哈希功能
// import cryptoService from '../utils/cryptoService';

// 接收父组件传递的卫星数量
const props = defineProps({
  satelliteCount: {
    type: Number,
    required: true
  },
  uploadedData: {
    type: Array,
    default: () => []
  }
});

// 定义事件发射器，用于通知父组件上链完成和恶意节点初始化完成
const emit = defineEmits(['uploadComplete', 'malicious-satellites-initialized']);

// 恶意节点相关数据
const maliciousSatellites = ref([]);
// 存储每个卫星每个区块的状态
const satelliteBlockStatuses = ref({});

// 初始化恶意节点
const initMaliciousSatellites = () => {
  maliciousSatellites.value = [];
  satelliteBlockStatuses.value = {};

  // 计算恶意节点数量：n/3向下取整
  const maliciousCount = Math.floor(props.satelliteCount / 3);

  // 随机选择恶意节点
  const allSatellites = Array.from({ length: props.satelliteCount }, (_, i) => i + 1);
  const shuffled = [...allSatellites].sort(() => 0.5 - Math.random());
  maliciousSatellites.value = shuffled.slice(0, maliciousCount);

  console.log('恶意节点：', maliciousSatellites.value);
  
  // 通知父组件恶意节点已初始化
  emit('malicious-satellites-initialized', maliciousSatellites.value);
};

// 检查卫星是否是恶意节点
const isMaliciousSatellite = (index) => {
  return maliciousSatellites.value.includes(index);
};

// 在组件挂载时初始化恶意节点
onMounted(() => {
  initMaliciousSatellites();
});

// 监听卫星数量变化，重新初始化恶意节点
watch(() => props.satelliteCount, () => {
  initMaliciousSatellites();
});

// 修复卫星节点方法
const repairSatellite = (satelliteIndex) => {
  // 检查是否是恶意节点
  if (isMaliciousSatellite(satelliteIndex)) {
    // 从恶意节点列表中移除
    const index = maliciousSatellites.value.indexOf(satelliteIndex);
    if (index !== -1) {
      maliciousSatellites.value.splice(index, 1);
    }
    
    // 清除该卫星的所有错误区块状态
    Object.keys(satelliteBlockStatuses.value).forEach(key => {
      if (key.startsWith(`${satelliteIndex}-`)) {
        delete satelliteBlockStatuses.value[key];
      }
    });
    
    // 重新生成该卫星的所有区块数据为正常状态
    blocks.value.forEach((_, blockIndex) => {
      satelliteBlockStatuses.value[`${satelliteIndex}-${blockIndex}`] = 'normal';
    });
    
    return true; // 修复成功
  }
  
  return false; // 不是恶意节点，无需修复
};

// 定义暴露给父组件的方法
defineExpose({
  isMaliciousSatellite,
  repairSatellite
});

// 为恶意节点生成区块状态
const generateMaliciousBlockStatus = () => {
  // 生成一个0-1之间的随机数
  const random = Math.random();

  // 根据概率分配不同状态
  // 25%概率出块内容错误
  if (random < 0.25) {
    return 'error';
  }
  // 25%概率不出块
  else if (random < 0.5) {
    return 'empty';
  }
  // 50%概率正常出块
  else {
    return 'normal';
  }
};

// 获取卫星区块状态
const getSatelliteBlockStatus = (satelliteIndex, blockIndex) => {
  // 如果不是恶意节点，返回正常
  if (!isMaliciousSatellite(satelliteIndex)) {
    return 'normal';
  }

  // 为恶意节点生成状态并缓存
  const key = `${satelliteIndex}-${blockIndex}`;
  if (!satelliteBlockStatuses.value[key]) {
    satelliteBlockStatuses.value[key] = generateMaliciousBlockStatus();
  }

  return satelliteBlockStatuses.value[key];
};

// 错误哈希值缓存 - 使用卫星索引和原始哈希的组合作为键
const errorHashCache = ref({});

// 同步版本的错误哈希生成函数，用于模板中调用
const generateErrorHashSync = (originalHash, satelliteIndex = null) => {
  // 创建缓存键，包含卫星索引
  const cacheKey = satelliteIndex ? `${originalHash}-${satelliteIndex}` : originalHash;
  
  // 检查缓存中是否已有该哈希值的错误版本
  if (errorHashCache.value[cacheKey]) {
    return errorHashCache.value[cacheKey];
  }
  
  // 如果没有原始哈希值，返回默认错误哈希
  if (!originalHash) return 'error_hash';
  
  try {
    // 在原始哈希末尾添加0-20的随机数和卫星索引（如果有）
    const randomNum = Math.floor(Math.random() * 21); // 0-20的随机数
    const modifiedData = satelliteIndex ? 
      `${originalHash}${randomNum}${satelliteIndex}` : 
      `${originalHash}${randomNum}`;
    
    // 使用简单的字符串哈希算法作为同步版本的备用方案
    let hash = 0;
    for (let i = 0; i < modifiedData.length; i++) {
      const char = modifiedData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 转换为16进制字符串
    let errorHash = Math.abs(hash).toString(16);
    
    // 通过重复哈希值并截取来生成64个字符的哈希值
    while (errorHash.length < 64) {
      errorHash += errorHash;
    }
    errorHash = errorHash.substring(0, 64);
    
    // 缓存结果
    errorHashCache.value[cacheKey] = errorHash;
    
    // 异步更新缓存 - 使用SHA-256算法计算更准确的哈希值
    generateErrorHash(originalHash, satelliteIndex).then(sha256Hash => {
      errorHashCache.value[cacheKey] = sha256Hash;
    });
    
    return errorHash;
  } catch (error) {
    console.error('生成错误哈希时出错:', error);
    return 'error_' + originalHash.substring(0, 6); // 发生错误时的备用方案
  }
};

// 获取卫星区块内容
const getSatelliteBlockContent = (satelliteIndex, blockIndex, block) => {
  const status = getSatelliteBlockStatus(satelliteIndex, blockIndex);

  if (status === 'empty') {
    return 'null'; // 不出块显示null
  } else if (status === 'error') {
    // 错误块显示错误的哈希值，传入卫星索引确保同一行中不同节点的错误区块有不同的哈希值
    return formatEncryptedData(generateErrorHashSync(block.encryptedData, satelliteIndex));
  } else {
    // 正常块显示正常内容
    return formatEncryptedData(block.encryptedData);
  }
};

// 生成错误的哈希值 - 在原始哈希的基础上，添加随机数后使用SHA-256算法再次哈希
// 添加satelliteIndex参数，确保同一行中不同节点的错误区块有不同的哈希值
const generateErrorHash = async (originalHash, satelliteIndex = null) => {
  // 如果没有原始哈希值，返回默认错误哈希
  if (!originalHash) return 'error_hash';
  
  try {
    // 在原始哈希末尾添加0-20的随机数和卫星索引（如果有）
    const randomNum = Math.floor(Math.random() * 21); // 0-20的随机数
    const modifiedData = satelliteIndex ? 
      `${originalHash}${randomNum}${satelliteIndex}` : 
      `${originalHash}${randomNum}`;
    
    // 使用SHA-256算法计算哈希
    const errorHash = await hashData(modifiedData);
    
    return errorHash;
  } catch (error) {
    console.error('生成错误哈希时出错:', error);
    return 'error_' + originalHash.substring(0, 6); // 发生错误时的备用方案
  }
};

// 使用SHA-256哈希替代加密，显著提高处理速度
async function hashData(data) {
  // 将输入数据转换为UTF-8编码的ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // 使用SHA-256算法计算哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // 将哈希值转换为十六进制字符串
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 区块数据
const blocks = ref([]);
const isUploading = ref(false);
// 上链进度变量已删除

// 根据卫星数量计算组件宽度
const calculateWidth = computed(() => {
  // 圆圈直径(45px) + 圆圈间距(25px) * 卫星数量 + 左右内边距(20px*2)
  const circleWidth = 45; // 圆圈宽度
  const circleGap = 25;   // 圆圈间距
  const padding = 40;     // 左右内边距总和

  // 计算所需总宽度
  const totalWidth = (circleWidth * props.satelliteCount) +
    (circleGap * (props.satelliteCount - 1)) +
    padding;

  // 确保最小宽度为300px，最大宽度不超过屏幕的40%
  return Math.max(Math.min(totalWidth, window.innerWidth * 0.4), 300);
});

// 监听上传数据变化
watch(() => props.uploadedData, (newData) => {
  if (newData && newData.length > 0) {
    processUploadedData(newData);
  }
}, { deep: true });

// 处理上传的数据，模拟区块链上链过程
const processUploadedData = async (data) => {
  isUploading.value = true;

  // 开始处理上链数据

  // 清空现有区块
  blocks.value = [];

  // 不再重新初始化恶意节点，保持组件挂载时确定的恶意节点不变
  // 创建文件ID到区块的映射，确保每个文件只创建一个区块
  const fileIdMap = new Map();

  // 不再需要计算唯一文件ID、总数和已处理数量，因为进度条已删除
  // const uniqueFileIds = new Set(data.map(item => item.fileId));
  // const totalUniqueFiles = uniqueFileIds.size;
  // let processedUniqueFiles = 0;

  // 首先遍历数据，为每个唯一的fileId创建一个区块
  for (let i = 0; i < data.length; i++) {
    const fileData = data[i];

    // 如果这个文件ID已经有区块了，就跳过
    if (fileIdMap.has(fileData.fileId)) {
      continue;
    }

    // 使用哈希替代加密，显著提高速度
    const blockDataStr = fileData.fileId + '-' + fileData.timestamp;
    // 使用简单的哈希函数替代加密
    const encryptedData = await hashData(blockDataStr);

    // 创建新区块，直接设置为已确认状态
    const newBlock = {
      number: fileIdMap.size + 1,
      hash: generateRandomHash(),
      timestamp: Date.now() + fileIdMap.size * 1000, // 每个区块时间戳递增
      transactions: [fileData], // 每个文件作为一个交易
      encryptedData: encryptedData, // 添加加密数据
      status: 'confirmed', // 直接设置为已确认状态
      active: true, // 设置为活动状态
      confirmed: true, // 设置为已确认
      fileId: fileData.fileId // 记录文件ID以便识别
    };

    // 将区块添加到映射中
    fileIdMap.set(fileData.fileId, newBlock);

    // 上链进度更新代码已删除

    // 将当前区块添加到区块数组中，实现实时显示
    blocks.value = Array.from(fileIdMap.values());

    // 不再需要延迟，直接处理下一个文件
  }

  // 上链进度显示代码已删除

  // 所有区块已添加，上链完成
  isUploading.value = false;
  // 触发上链完成事件
  emit('uploadComplete');
};

// 注释掉原来的模拟区块确认过程，因为现在上链进度是在processUploadedData函数中直接处理的
// 保留此函数的注释以便理解原来的逻辑
/*
const simulateBlockConfirmation = () => {
  let currentBlockIndex = 0;
  const totalBlocks = blocks.value.length;
  
  // 如果没有区块，直接结束
  if (totalBlocks === 0) {
    isUploading.value = false;
    return;
  }
  
  const confirmBlock = () => {
    if (currentBlockIndex < totalBlocks) {
      // 激活当前区块
      blocks.value.forEach((block, index) => {
        block.active = index === currentBlockIndex;
      });
      
      // 更新状态为处理中
      blocks.value[currentBlockIndex].status = 'processing';
      
      // 2秒后确认区块
      setTimeout(() => {
        blocks.value[currentBlockIndex].status = 'confirmed';
        blocks.value[currentBlockIndex].confirmed = true;
        
        // 更新进度
        uploadProgress.value = Math.round(((currentBlockIndex + 1) / totalBlocks) * 100);
        
        // 处理下一个区块
        currentBlockIndex++;
        
        if (currentBlockIndex < totalBlocks) {
          confirmBlock();
        } else {
          // 所有区块已确认
          setTimeout(() => {
            isUploading.value = false;
          }, 1000);
        }
      }, 2000);
    }
  };
  
  // 开始确认第一个区块
  confirmBlock();
};
*/

// 生成随机哈希值 - 优化版本，减少长度以提高性能
const generateRandomHash = () => {
  const characters = '0123456789abcdef';
  let hash = '0x';
  // 减少哈希长度从64到16，进一步提高性能
  for (let i = 0; i < 16; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
};

// 格式化加密数据，长密文使用省略号表示
const formatEncryptedData = (encryptedData) => {
  if (!encryptedData) return '';

  // 如果密文长度超过8个字符，则只显示前4位和后3位
  if (encryptedData.length > 8) {
    const prefix = encryptedData.substring(0, 4);
    const suffix = encryptedData.substring(encryptedData.length - 3);
    return `${prefix}..${suffix}`;
  }

  return encryptedData;
};

// 不再需要过滤区块，所有卫星显示相同的区块

// 初始化组件
onMounted(() => {
  // 不再预先创建区块，只有在上传数据时才显示区块
  blocks.value = [];
});
</script>

<style scoped>
.blockchain-visualizer {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 80vh;
  background: rgba(17, 24, 39, 0.8);
  border-radius: 0 20px 20px 0;
  border-right: 1px solid #374151;
  border-top: 1px solid #374151;
  border-bottom: 1px solid #374151;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 20px;
  color: #e5e7eb;
  z-index: 100;
  overflow: hidden; /* 防止内容溢出 */
}

/* 卫星头部样式 */
.satellite-header {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 25px;
  margin: 0 auto;
  padding: 15px;
  max-width: 100%;
}

/* 卫星圆圈容器 */
.satellite-circle-container {
  display: flex;
  justify-content: center;
  width: 45px; /* 固定宽度与圆圈相同 */
  flex-shrink: 0;
}

/* 区块链内容区域 */
.blockchain-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(80vh - 150px); /* 减去头部和底部的高度 */
  padding: 0 15px;
  margin-top: 10px;
  margin-bottom: 10px;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #3b82f6 rgba(17, 24, 39, 0.5); /* Firefox */
}

/* 区块链行容器 */
.blockchain-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 区块链单行 */
.blockchain-row {
  display: flex;
  justify-content: center;
  gap: 25px; /* 与卫星圆圈间距相同 */
  width: 100%;
}

.satellite-circle {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #1e40af;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  border: 1px solid #60a5fa;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* 恶意节点样式 */
.satellite-circle.malicious {
  background: #991b1b;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  border: 1px solid #ef4444;
}

/* 恶意节点图标 */
.satellite-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.satellite-circle::after {
  content: attr(data-index);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  text-shadow: 0 0 3px black, 0 0 3px black; /* 确保数字在图片上清晰可见 */
}

/* 自定义滚动条 */
.blockchain-content::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.blockchain-content::-webkit-scrollbar-track {
  background: rgba(17, 24, 39, 0.5);
  border-radius: 10px;
}

.blockchain-content::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 10px;
}

/* 卫星区块样式 */
.satellite-block {
  width: 45px; /* 与卫星圆圈宽度相同 */
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0; /* 防止区块被压缩 */
}

/* 区块连接线 */
.block-connector {
  position: absolute;
  top: -10px; /* 连接线的顶部距离 */
  left: 50%;
  width: 2px;
  height: 10px; /* 连接线的高度 */
  background-color: #3b82f6;
  transform: translateX(-50%);
}

/* 箭头指向 */
.block-connector::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-4px) rotate(45deg);
  width: 6px;
  height: 6px;
  border-bottom: 2px solid #3b82f6;
  border-right: 2px solid #3b82f6;
}

/* 加密数据方框 */
.encrypted-data-box {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #1e3a8a;
  border-radius: 4px;
  padding: 4px 6px;
  font-family: monospace;
  font-size: 0.65rem;
  color: #60a5fa;
  text-align: center;
  word-break: break-all;
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 错误区块样式 */
.error-block .encrypted-data-box {
  background: rgba(153, 27, 27, 0.8);
  border: 1px solid #dc2626;
  color: #fca5a5;
  box-shadow: 0 0 5px rgba(220, 38, 38, 0.5);
}

/* 空区块样式 */
.empty-block .encrypted-data-box {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

.block.active .encrypted-data-box {
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  transform: scale(1.05);
}

.block.confirmed .encrypted-data-box {
  border-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.block-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

/* 哈希值显示 */
.hash-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.hash-box {
  width: 60px;
  height: 30px;
  border: 1px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 0.8rem;
  color: #60a5fa;
  background: rgba(30, 64, 175, 0.2);
}

.hash-arrow {
  width: 2px;
  height: 15px;
  background-color: #3b82f6;
  position: relative;
  margin: 2px 0;
}

.hash-arrow::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(50%) rotate(45deg);
  width: 6px;
  height: 6px;
  border-right: 2px solid #3b82f6;
  border-bottom: 2px solid #3b82f6;
}

.block-number {
  font-weight: bold;
  color: #60a5fa;
}

.block-hash {
  color: #9ca3af;
  font-size: 0.8rem;
}

.block-content {
  font-size: 0.85rem;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-label {
  color: #9ca3af;
}

.info-value {
  font-weight: 500;
}

.status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.status.pending {
  background: #374151;
  color: #9ca3af;
}

.status.processing {
  background: #1e40af;
  color: #60a5fa;
}

.status.confirmed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* 加密数据样式 */
.encrypted-data {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #374151;
}

.data-label {
  color: #9ca3af;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.data-value {
  font-family: monospace;
  font-size: 0.75rem;
  background: rgba(17, 24, 39, 0.5);
  padding: 4px 6px;
  border-radius: 4px;
  word-break: break-all;
  color: #60a5fa;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 上链进度指示器已删除 */
</style>