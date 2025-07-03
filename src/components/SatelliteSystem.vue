<template>
  <div class="satellite-system">
    <!-- Starry background -->
    <div class="starry-background">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
    </div>

    <!-- Main container -->
    <div class="system-container">
      <!-- Earth in the center -->
      <div class="earth-container">
        <img class="earth-img" src="@/assets/earth.jpg" alt="Earth" />
      </div>

      <!-- Communication lines between satellites only -->
      <div class="communication-lines">
        <div
          v-for="[i, j] in satelliteLinePairs"
          :key="'full-line-' + i + '-' + j"
          class="comm-line"
          :style="getLineStyle(i, j)"
        ></div>
      </div>

      <!-- Satellites -->
      <div
        v-for="(satellite, index) in satellites"
        :key="index"
        :ref="el => satelliteRefs[index] = el"
        class="satellite"
        :style="{ left: satellite.x + 'px', top: satellite.y + 'px' }"
        @click="showContextMenu($event, index)"
      >
        <img
          :src="require('../assets/satellite.jpg')"
          alt="卫星"
          class="satellite-img"
          style="width: 80px; height: 80px; transform: translate(-50%, -50%); position: absolute; left: 50%; top: 50%; cursor: pointer; transition: left 0.5s, top 0.5s; z-index: 11;"
        />
      </div>

      <!-- Context Menu -->
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{
          left: contextMenu.x + 'px',
          top: contextMenu.y + 'px',
          transform: contextMenu.transform
        }"
        @click.stop
      >
        <div class="menu-arrow" :class="contextMenu.arrowPosition"></div>
        <div class="menu-items">
          <button
            v-for="item in menuItems"
            :key="item"
            class="menu-item"
            @click="handleMenuClick(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </div>

    <!-- Function Buttons -->
    <div class="function-buttons">
      <button class="function-btn upload-btn" @click="handleUploadFile">
        📁 上传文件夹
      </button>
      <button class="function-btn query-btn" @click="showQueryModal">
        🔍 查询数据
      </button>
    </div>

    <!-- Encryption Test Panel -->
    <div class="encryption-panel">
      <div class="panel-header">
        <h3>🔐 加密测试功能</h3>
      </div>
      
      <!-- Function Selection -->
      <div class="function-selector">
        <button 
          v-for="(func, index) in encryptionFunctions" 
          :key="index"
          class="function-tab"
          :class="{ active: currentFunction === index }"
          @click="currentFunction = index"
        >
          {{ func.name }}
        </button>
      </div>

      <!-- Function 1: Basic Encryption/Decryption -->
      <div v-if="currentFunction === 0" class="function-content">
        <div class="node-selection">
          <label>选择发送方 (A):</label>
          <select v-model="encryptionTest.senderA" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
          
          <label>选择接收方 (B):</label>
          <select v-model="encryptionTest.receiverB" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
        </div>
        
        <div class="message-input">
          <label>消息内容:</label>
          <input 
            v-model="encryptionTest.message" 
            type="text" 
            placeholder="输入要发送的消息，如：Alice123"
            class="message-field"
          />
        </div>
        
        <div class="action-buttons">
          <button 
            @click="encryptMessage" 
            :disabled="!canEncrypt"
            class="action-btn encrypt-btn"
          >
            🔒 加密
          </button>
          <button 
            @click="sendMessage" 
            :disabled="!encryptionTest.ciphertext"
            class="action-btn send-btn"
          >
            📤 发送
          </button>
          <button 
            @click="decryptMessage" 
            :disabled="!encryptionTest.sent"
            class="action-btn decrypt-btn"
          >
            🔓 解密
          </button>
        </div>
        
        <div class="result-display">
          <div v-if="encryptionTest.ciphertext" class="cipher-result">
            <label>密文:</label>
            <div class="cipher-text">{{ encryptionTest.ciphertext }}</div>
          </div>
          <div v-if="encryptionTest.result" class="operation-result">
            {{ encryptionTest.result }}
          </div>
        </div>
      </div>

      <!-- Function 2: Tampering Detection -->
      <div v-if="currentFunction === 1" class="function-content">
        <div class="node-selection">
          <label>选择发送方 (A):</label>
          <select v-model="tamperingTest.senderA" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
          
          <label>选择接收方 (B):</label>
          <select v-model="tamperingTest.receiverB" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
          
          <label>选择篡改方 (C):</label>
          <select v-model="tamperingTest.tampererC" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
        </div>
        
        <div class="message-input">
          <label>消息内容:</label>
          <input 
            v-model="tamperingTest.message" 
            type="text" 
            placeholder="输入要发送的消息"
            class="message-field"
          />
        </div>
        
        <div class="action-buttons">
          <button 
            @click="encryptForTampering" 
            :disabled="!canTestTampering"
            class="action-btn encrypt-btn"
          >
            🔒 加密
          </button>
          <button 
            @click="tamperMessage" 
            :disabled="!tamperingTest.originalCipher"
            class="action-btn tamper-btn"
          >
            🔧 篡改并发送
          </button>
          <button 
            @click="decryptTamperedMessage" 
            :disabled="!tamperingTest.tampered"
            class="action-btn decrypt-btn"
          >
            🔓 解密
          </button>
        </div>
        
        <div class="result-display">
          <div v-if="tamperingTest.originalCipher" class="cipher-result">
            <label>原始密文:</label>
            <div class="cipher-text">{{ tamperingTest.originalCipher }}</div>
          </div>
          <div v-if="tamperingTest.tamperedCipher" class="cipher-result">
            <label>篡改后密文:</label>
            <div class="cipher-text tampered">{{ tamperingTest.tamperedCipher }}</div>
          </div>
          <div v-if="tamperingTest.result" class="operation-result">
            {{ tamperingTest.result }}
          </div>
        </div>
      </div>

      <!-- Function 3: Identity-based Encryption Security -->
      <div v-if="currentFunction === 2" class="function-content">
        <div class="node-selection">
          <label>选择发送方 (A):</label>
          <select v-model="identityTest.senderA" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
          
          <label>选择接收方 (B):</label>
          <select v-model="identityTest.receiverB" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
          
          <label>选择无权解密方 (C):</label>
          <select v-model="identityTest.unauthorizedC" class="node-select">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satellites" :key="index" :value="index">
              卫星 {{ index + 1 }}
            </option>
          </select>
        </div>
        
        <div class="message-input">
          <label>消息内容:</label>
          <input 
            v-model="identityTest.message" 
            type="text" 
            placeholder="输入要发送的消息"
            class="message-field"
          />
        </div>
        
        <div class="action-buttons">
          <button 
            @click="encryptForIdentity" 
            :disabled="!canTestIdentity"
            class="action-btn encrypt-btn"
          >
            🔒 加密
          </button>
          <button 
            @click="sendIdentityMessage" 
            :disabled="!identityTest.ciphertext"
            class="action-btn send-btn"
          >
            📤 发送
          </button>
          <button 
            @click="decryptIdentityMessage" 
            :disabled="!identityTest.sent"
            class="action-btn decrypt-btn"
          >
            🔓 B解密
          </button>
          <button 
            @click="unauthorizedDecrypt" 
            :disabled="!identityTest.sent"
            class="action-btn unauthorized-btn"
          >
            🚫 C强行解密
          </button>
        </div>
        
        <div class="result-display">
          <div v-if="identityTest.ciphertext" class="cipher-result">
            <label>密文:</label>
            <div class="cipher-text">{{ identityTest.ciphertext }}</div>
          </div>
          <div v-if="identityTest.result" class="operation-result">
            {{ identityTest.result }}
          </div>
        </div>
      </div>
    </div>

    <!-- Query Modal -->
    <div v-if="queryModal.visible" class="modal-overlay" @click="closeQueryModal">
      <div class="query-modal" @click.stop>
        <div class="modal-header">
          <h3>数据查询</h3>
          <button class="close-btn" @click="closeQueryModal">×</button>
        </div>
        <div class="modal-content">
          <div class="query-input-section">
            <label for="queryInput">请输入查询条件：</label>
            <input
              id="queryInput"
              v-model="queryModal.queryText"
              type="text"
              placeholder="输入要查询的数据..."
              class="query-input"
              @keyup.enter="handleQuery"
            />
            <button class="submit-query-btn" @click="handleQuery">
              提交查询
            </button>
          </div>
          <div class="query-results-section">
            <h4>查询结果：</h4>
            <div class="results-container">
              <div v-if="queryModal.loading" class="loading">查询中...</div>
              <div v-else-if="queryModal.results.length === 0" class="no-results">
                暂无查询结果
              </div>
              <div v-else class="results-list">
                <div
                  v-for="(result, index) in queryModal.results"
                  :key="index"
                  class="result-item"
                >
                  {{ result }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Input (hidden) -->
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      @change="handleFileSelect"
      accept=".csv"
      multiple
      webkitdirectory
    />

    <!-- Click outside to close menu -->
    <div
      v-if="contextMenu.visible"
      class="overlay"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineProps } from 'vue'

const props = defineProps({
  satelliteCount: {
    type: Number,
    default: 4,
    validator: (value) => value >= 3 && value <= 12
  }
})

const satelliteRefs = ref([])
const fileInput = ref(null)

const earthCenter = { x: 600, y: 600 } // system-container中心
const satelliteRadius = 350 // 调整轨道半径，确保卫星不超出界面

const satellites = ref(Array.from({ length: props.satelliteCount }, (_, i) => {
  const angle = (2 * Math.PI / props.satelliteCount) * i - Math.PI / 2 // 使第一个卫星在正上方
  return {
    x: earthCenter.x + satelliteRadius * Math.cos(angle),
    y: earthCenter.y + satelliteRadius * Math.sin(angle)
  }
}))

const satelliteLinePairs = computed(() => {
  const pairs = [];
  for (let i = 0; i < satellites.value.length; i++) {
    for (let j = i + 1; j < satellites.value.length; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
});

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  transform: '',
  arrowPosition: 'bottom',
  satelliteIndex: -1
})

const menuItems = ref(['test1', 'test2', 'test3'])

// Query Modal State
const queryModal = ref({
  visible: false,
  queryText: '',
  loading: false,
  results: []
})

// Encryption test functionality
const currentFunction = ref(0)
const encryptionFunctions = ref([
  { name: '测试加/解密' },
  { name: '测试密文不可篡改性' },
  { name: '测试基于身份加密安全性' }
])

// Function 1: Basic encryption/decryption
const encryptionTest = ref({
  senderA: -1,
  receiverB: -1,
  message: '',
  ciphertext: '',
  sent: false,
  result: ''
})

// Function 2: Tampering detection
const tamperingTest = ref({
  senderA: -1,
  receiverB: -1,
  tampererC: -1,
  message: '',
  originalCipher: '',
  tamperedCipher: '',
  tampered: false,
  result: ''
})

// Function 3: Identity-based encryption security
const identityTest = ref({
  senderA: -1,
  receiverB: -1,
  unauthorizedC: -1,
  message: '',
  ciphertext: '',
  sent: false,
  result: ''
})

// Computed properties for validation
const canEncrypt = computed(() => {
  return encryptionTest.value.senderA !== -1 && 
         encryptionTest.value.receiverB !== -1 && 
         encryptionTest.value.message.trim() !== ''
})

const canTestTampering = computed(() => {
  return tamperingTest.value.senderA !== -1 && 
         tamperingTest.value.receiverB !== -1 && 
         tamperingTest.value.tampererC !== -1 && 
         tamperingTest.value.message.trim() !== ''
})

const canTestIdentity = computed(() => {
  return identityTest.value.senderA !== -1 && 
         identityTest.value.receiverB !== -1 && 
         identityTest.value.unauthorizedC !== -1 && 
         identityTest.value.message.trim() !== ''
})

// Encryption test functions
const encryptMessage = () => {
  const message = encryptionTest.value.message
  const senderName = `卫星${encryptionTest.value.senderA + 1}`
  const receiverName = `卫星${encryptionTest.value.receiverB + 1}`
  
  // Simulate encryption
  const cipher = btoa(message + '_encrypted_' + Date.now())
  encryptionTest.value.ciphertext = cipher
  encryptionTest.value.result = `✅ ${senderName} 成功加密消息"${message}"，准备发送给 ${receiverName}`
}

const sendMessage = () => {
  encryptionTest.value.sent = true
  encryptionTest.value.result = `📤 密文已从卫星${encryptionTest.value.senderA + 1} 发送到 卫星${encryptionTest.value.receiverB + 1}`
}

const decryptMessage = () => {
  try {
    const decrypted = atob(encryptionTest.value.ciphertext).split('_encrypted_')[0]
    encryptionTest.value.result = `🔓 卫星${encryptionTest.value.receiverB + 1} 成功解密，原始消息: "${decrypted}"`
  } catch (error) {
    encryptionTest.value.result = `❌ 解密失败: 密文格式错误`
  }
}

// Tampering test functions
const encryptForTampering = () => {
  const message = tamperingTest.value.message
  const cipher = btoa(message + '_secure_' + Date.now())
  tamperingTest.value.originalCipher = cipher
  tamperingTest.value.result = `✅ 卫星${tamperingTest.value.senderA + 1} 加密完成，原始密文已生成`
}

const tamperMessage = () => {
  // Simulate tampering by modifying the cipher
  const tampered = tamperingTest.value.originalCipher.slice(0, -5) + 'XXXXX'
  tamperingTest.value.tamperedCipher = tampered
  tamperingTest.value.tampered = true
  tamperingTest.value.result = `🔧 卫星${tamperingTest.value.tampererC + 1} 篡改了密文并发送给 卫星${tamperingTest.value.receiverB + 1}`
}

const decryptTamperedMessage = () => {
  try {
    // Attempt to decrypt tampered cipher - this will fail
    atob(tamperingTest.value.tamperedCipher)
    tamperingTest.value.result = `❌ 卫星${tamperingTest.value.receiverB + 1} 检测到密文被篡改！解密失败，拒绝接收消息`
  } catch (error) {
    tamperingTest.value.result = `❌ 卫星${tamperingTest.value.receiverB + 1} 检测到密文被篡改！解密失败，拒绝接收消息`
  }
}

// Identity-based encryption test functions
const encryptForIdentity = () => {
  const message = identityTest.value.message
  const receiverIdentity = `satellite_${identityTest.value.receiverB + 1}`
  const cipher = btoa(message + '_identity_' + receiverIdentity + '_' + Date.now())
  identityTest.value.ciphertext = cipher
  identityTest.value.result = `✅ 卫星${identityTest.value.senderA + 1} 使用身份加密，仅 卫星${identityTest.value.receiverB + 1} 可解密`
}

const sendIdentityMessage = () => {
  identityTest.value.sent = true
  identityTest.value.result = `📤 身份加密密文已发送，仅授权接收方可解密`
}

const decryptIdentityMessage = () => {
  try {
    const parts = atob(identityTest.value.ciphertext).split('_identity_')
    const message = parts[0]
    identityTest.value.result = `🔓 卫星${identityTest.value.receiverB + 1} 身份验证成功，解密消息: "${message}"`
  } catch (error) {
    identityTest.value.result = `❌ 卫星${identityTest.value.receiverB + 1} 解密失败`
  }
}

const unauthorizedDecrypt = () => {
  identityTest.value.result = `🚫 卫星${identityTest.value.unauthorizedC + 1} 尝试解密失败：身份验证不通过，无法获取私钥进行解密`
}
// New reactive variable for inverted index and file management
const invertedIndex = ref({}); // 关键字 -> 文件ID列表(逗号分隔的字符串)
const fileIdCounter = ref(1); // 文件ID计数器，从1开始
const fileIdToName = ref({}); // 文件ID -> 文件名映射

const getLineStyle = (fromIndex, toIndex) => {
  const from = satellites.value[fromIndex]
  const to = satellites.value[toIndex]
  // 卫星中心点坐标（图片80x80，中心点+40,+40）
  const fromCenterX = from.x + 40;
  const fromCenterY = from.y + 40;
  const toCenterX = to.x + 40;
  const toCenterY = to.y + 40;
  const deltaX = toCenterX - fromCenterX
  const deltaY = toCenterY - fromCenterY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
  return {
    position: 'absolute',
    left: fromCenterX + 'px',
    top: fromCenterY + 'px',
    width: distance + 'px',
    height: '2px',
    transformOrigin: '0 50%',
    transform: `rotate(${angle}deg)`,
    background: 'none',
    borderTop: '2px dashed #FFFFFF',
    zIndex: 10
  }
}

const showContextMenu = (event, index) => {
  event.stopPropagation()
  const satellite = satellites.value[index]

  // 计算卫星相对于地球中心的位置
  const deltaX = satellite.x - earthCenter.x
  const deltaY = satellite.y - earthCenter.y

  let menuX = satellite.x + 70
  let menuY = satellite.y + 20
  let arrowPos = 'left'

  // 根据卫星位置动态调整菜单位置
  if (deltaY < -200) { // 上方
    menuX = satellite.x + 10
    menuY = satellite.y + 50
    arrowPos = 'top'
  } else if (deltaX > 200) { // 右方
    menuX = satellite.x - 110
    menuY = satellite.y + 5
    arrowPos = 'right'
  } else if (deltaY > 200) { // 下方
    menuX = satellite.x + 10
    menuY = satellite.y - 90
    arrowPos = 'bottom'
  } else if (deltaX < -200) { // 左方
    menuX = satellite.x + 70
    menuY = satellite.y + 5
    arrowPos = 'left'
  }

  contextMenu.value = {
    visible: true,
    x: menuX,
    y: menuY,
    transform: '',
    arrowPosition: arrowPos,
    satelliteIndex: index
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const handleMenuClick = (item) => {
  console.log(`执行 ${item} 功能，卫星编号: ${contextMenu.value.satelliteIndex + 1}`)
  alert(`执行 ${item} 功能，卫星编号: ${contextMenu.value.satelliteIndex + 1}`)
  closeContextMenu()
}

const handleClickOutside = () => {
  closeContextMenu()
}

// File Upload Functions
const handleUploadFile = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;
  
  // 过滤出CSV文件
  const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
  
  if (csvFiles.length === 0) {
    alert('未找到CSV文件！请选择包含CSV文件的文件夹。');
    event.target.value = '';
    return;
  }
  
  console.log(`找到 ${csvFiles.length} 个CSV文件`);
  
  // 重置索引和计数器
  invertedIndex.value = {};
  fileIdCounter.value = 1;
  fileIdToName.value = {};
  
  let processedFiles = 0;
  let totalKeywords = 0;
  
  // 处理每个CSV文件
  csvFiles.forEach((file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        const currentFileId = fileIdCounter.value;
        
        // 记录文件ID到文件名的映射
        fileIdToName.value[currentFileId] = fileNameWithoutExtension;
        
        // 解析CSV内容
        const rows = content.split('\n').filter(row => row.trim());
        let fileKeywordCount = 0;
        
        rows.forEach((row) => {
          const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          columns.forEach((keyword) => {
            if (keyword) {
              // 建立倒排索引：关键字 -> 文件ID列表
              if (!invertedIndex.value[keyword]) {
                invertedIndex.value[keyword] = [];
              }
              
              // 如果该关键字还没有包含当前文件ID，则添加
              if (!invertedIndex.value[keyword].includes(currentFileId)) {
                invertedIndex.value[keyword].push(currentFileId);
              }
              
              fileKeywordCount++;
            }
          });
        });
        
        totalKeywords += fileKeywordCount;
        fileIdCounter.value++; // 文件ID自增
        processedFiles++;
        
        console.log(`处理文件: ${file.name}, ID: ${currentFileId}, 关键字数: ${fileKeywordCount}`);
        
        // 当所有文件处理完成时显示结果
        if (processedFiles === csvFiles.length) {
          // 将数组转换为逗号分隔的字符串
          Object.keys(invertedIndex.value).forEach(keyword => {
            invertedIndex.value[keyword] = invertedIndex.value[keyword].join(',');
          });
          
          console.log('倒排索引已建立:', invertedIndex.value);
          console.log('文件ID映射:', fileIdToName.value);
          
          const sampleKeyword = Object.keys(invertedIndex.value)[0];
          const sampleFileIds = invertedIndex.value[sampleKeyword];
          
          alert(`批量上传成功！\n\n📊 统计信息:\n- 处理文件数: ${csvFiles.length}\n- 总关键字数: ${totalKeywords}\n- 唯一关键字数: ${Object.keys(invertedIndex.value).length}\n\n🔍 示例索引:\n- 关键字: "${sampleKeyword || 'N/A'}"\n- 文件ID: [${sampleFileIds || 'N/A'}]\n- 对应文件: [${sampleFileIds ? sampleFileIds.split(',').map(id => fileIdToName.value[id]).join(', ') : 'N/A'}]`);
        }
        
      } catch (error) {
        console.error(`CSV解析错误 (${file.name}):`, error);
        processedFiles++;
        
        if (processedFiles === csvFiles.length) {
          alert('部分文件解析失败，请检查文件格式！');
        }
      }
    };
    
    reader.onerror = () => {
      console.error(`文件读取失败: ${file.name}`);
      processedFiles++;
      
      if (processedFiles === csvFiles.length) {
        alert('部分文件读取失败！');
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  });
  
  // 清空文件输入
  event.target.value = '';
}

// Query Modal Functions
const showQueryModal = () => {
  queryModal.value.visible = true
  queryModal.value.queryText = ''
  queryModal.value.results = []
}

const closeQueryModal = () => {
  queryModal.value.visible = false
  queryModal.value.loading = false
}

const handleQuery = () => {
  if (!queryModal.value.queryText.trim()) {
    alert('请输入查询条件')
    return
  }

  queryModal.value.loading = true
  queryModal.value.results = []
  
  // 记录查询开始时间
  const startTime = performance.now();

  // 模拟查询过程
  setTimeout(() => {
    queryModal.value.loading = false
    
    // 计算查询耗时
    const endTime = performance.now();
    const queryDuration = ((endTime - startTime) / 1000).toFixed(3);
    
    const queryInput = queryModal.value.queryText.trim();
    
    // 检查是否为多关键字查询（包含逗号）
    if (queryInput.includes(',')) {
      // 多关键字查询
      const keywords = queryInput.split(',').map(k => k.trim()).filter(k => k);
      
      if (keywords.length === 0) {
        alert('请输入有效的查询关键字');
        return;
      }
      
      // 对每个关键字查询文件ID，然后取交集
      const keywordResults = [];
      const missingKeywords = [];
      
      keywords.forEach(keyword => {
        if (invertedIndex.value[keyword]) {
          const fileIds = invertedIndex.value[keyword].split(',').map(id => parseInt(id));
          keywordResults.push({ keyword, fileIds });
        } else {
          missingKeywords.push(keyword);
        }
      });
      
      if (keywordResults.length === 0) {
        queryModal.value.results = [
           `多关键字查询: [${keywords.map(k => `"${k}"`).join(', ')}]`,
           '❌ 所有关键字都未找到匹配',
           '',
           '💡 建议:',
           '1. 检查关键字拼写',
           '2. 尝试使用文件中的确切关键字',
           '3. 确保已上传CSV文件夹并建立索引',
           '',
           `⏱️ 查询耗时: ${queryDuration} 秒`
         ];
        return;
      }
      
      // 计算交集：找到同时包含所有找到关键字的文件ID
      let intersectionIds = keywordResults[0].fileIds;
      for (let i = 1; i < keywordResults.length; i++) {
        intersectionIds = intersectionIds.filter(id => keywordResults[i].fileIds.includes(id));
      }
      
      if (intersectionIds.length > 0) {
        const fileNames = intersectionIds.map(id => fileIdToName.value[id]);
        
        queryModal.value.results = [
           `多关键字查询: [${keywords.map(k => `"${k}"`).join(', ')}]`,
           `找到 ${intersectionIds.length} 个同时包含所有关键字的文件:`,
           '',
           '🔍 查询详情:',
           ...keywordResults.map(result => `   "${result.keyword}" -> ${result.fileIds.length} 个文件`),
           ...(missingKeywords.length > 0 ? [`   未找到: [${missingKeywords.map(k => `"${k}"`).join(', ')}]`] : []),
           '',
           '📋 交集结果 - 同时包含所有关键字的文件:',
           ...intersectionIds.map((id, index) => `📄 ID: ${id} | 文件: ${fileNames[index]}.csv`),
           '',
           `🔢 文件ID: [${intersectionIds.join(', ')}]`,
           '💡 提示: 多关键字交集查询完成',
           '',
           `⏱️ 查询耗时: ${queryDuration} 秒`
         ];
      } else {
        queryModal.value.results = [
           `多关键字查询: [${keywords.map(k => `"${k}"`).join(', ')}]`,
           '❌ 没有文件同时包含所有关键字',
           '',
           '🔍 各关键字查询结果:',
           ...keywordResults.map(result => `   "${result.keyword}" -> 文件ID: [${result.fileIds.join(', ')}]`),
           ...(missingKeywords.length > 0 ? [`   未找到: [${missingKeywords.map(k => `"${k}"`).join(', ')}]`] : []),
           '',
           '💡 建议: 尝试减少关键字数量或使用更通用的关键字',
           '',
           `⏱️ 查询耗时: ${queryDuration} 秒`
         ];
      }
    } else {
      // 单关键字查询（原有逻辑）
      const queryKeyword = queryInput;
      
      if (invertedIndex.value[queryKeyword]) {
        const fileIds = invertedIndex.value[queryKeyword].split(',');
        const fileNames = fileIds.map(id => fileIdToName.value[parseInt(id)]);
        
        queryModal.value.results = [
           `查询关键字: "${queryKeyword}"`,
           `找到 ${fileIds.length} 个匹配的文件:`,
           '',
           '📋 文件列表:',
           ...fileIds.map((id, index) => `📄 ID: ${id} | 文件: ${fileNames[index]}.csv`),
           '',
           `🔢 文件ID: [${fileIds.join(', ')}]`,
           '💡 提示: 单关键字查询完成',
           '',
           `⏱️ 查询耗时: ${queryDuration} 秒`
         ];
      } else {
        // 查找相似的时间格式关键字（用于调试）
        const timeRelatedKeys = Object.keys(invertedIndex.value).filter(key => 
          key.includes('2012/10/7') || key.includes('8:00:00')
        ).slice(0, 10);
        
        queryModal.value.results = [
           `查询关键字: "${queryKeyword}"`,
           '❌ 未找到匹配的关键字',
           '',
           '🔍 调试信息 - 索引中相关的时间关键字:',
           ...timeRelatedKeys.map(key => `   "${key}"`),
           '',
           '💡 建议:',
           '1. 检查关键字拼写',
           '2. 尝试使用文件中的确切关键字',
           '3. 确保已上传CSV文件夹并建立索引',
           '4. 使用逗号分隔多个关键字进行组合查询',
           '',
           `📊 当前索引状态:`,
           `- 已索引文件数: ${Object.keys(fileIdToName.value).length}`,
           `- 唯一关键字数: ${Object.keys(invertedIndex.value).length}`,
           '',
           `⏱️ 查询耗时: ${queryDuration} 秒`
         ];
      }
    }
  }, 800)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.comm-line {
  animation: commBlink 2s ease-in-out infinite;
}

@keyframes commBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.satellite-system {
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
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

.system-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1200px;
  height: 1200px;
}

/* Realistic Earth Styles */
.earth-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  height: 480px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.earth-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 0 60px 20px #1e90ff44, 0 0 0 8px #1e90ff22;
  animation: earth-rotate 8s linear infinite;
  object-fit: cover;
}
@keyframes earth-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.earth {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background:
    radial-gradient(circle at 25% 25%, #87ceeb 0%, #4682b4 30%, #1e40af 60%, #0f172a 100%),
    conic-gradient(from 0deg at 50% 50%,
      #1e40af 0deg, #2563eb 60deg, #3b82f6 120deg,
      #1e40af 180deg, #1e3a8a 240deg, #2563eb 300deg, #1e40af 360deg);
  background-blend-mode: multiply;
  animation: rotate 30s linear infinite;
  box-shadow:
    inset -40px -40px 80px rgba(0,0,0,0.6),
    inset 20px 20px 40px rgba(135,206,235,0.2),
    0 0 60px rgba(30,144,255,0.8),
    0 0 120px rgba(59,130,246,0.4),
    0 0 200px rgba(30,144,255,0.2);
  filter: brightness(1.1) contrast(1.2);
}

.earth-continents {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 45px 35px at 25% 35%, #2d5016 0%, #3d6b1f 40%, transparent 70%),
    radial-gradient(ellipse 40px 30px at 70% 25%, #2d5016 0%, #4a7c2a 50%, transparent 80%),
    radial-gradient(ellipse 50px 40px at 60% 70%, #1f3d0c 0%, #2d5016 30%, #4a7c2a 60%, transparent 85%),
    radial-gradient(ellipse 35px 45px at 20% 75%, #2d5016 0%, #3d6b1f 45%, transparent 75%),
    radial-gradient(ellipse 30px 25px at 80% 60%, #1f3d0c 0%, #2d5016 40%, transparent 70%),
    radial-gradient(ellipse 25px 20px at 15% 50%, #2d5016 0%, #4a7c2a 50%, transparent 80%);
  opacity: 0.9;
  mix-blend-mode: overlay;
}

.earth-atmosphere {
  position: absolute;
  top: -5px;
  left: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 10px);
  border-radius: 50%;
  background: radial-gradient(circle, transparent 85%, rgba(135,206,235,0.3) 90%, transparent 100%);
}

.earth-clouds {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 30px 15px at 30% 20%, rgba(255,255,255,0.4), transparent),
    radial-gradient(ellipse 25px 12px at 70% 40%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 35px 18px at 45% 65%, rgba(255,255,255,0.35), transparent),
    radial-gradient(ellipse 20px 10px at 80% 80%, rgba(255,255,255,0.3), transparent);
  animation: rotate 45s linear infinite reverse;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Communication Lines */
.communication-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.comm-line {
  position: absolute;
}

@keyframes commBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Enhanced Realistic Satellite Styles */
.satellite {
  position: absolute;
  width: 60px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
}

.satellite:hover {
  transform: scale(1.15);
  filter: brightness(1.3) drop-shadow(0 0 15px rgba(59, 130, 246, 0.6));
}

.satellite.top {
  top: 50px;
  left: 270px;
}

.satellite.right {
  right: 50px;
  top: 270px;
}

.satellite.bottom {
  bottom: 50px;
  left: 270px;
}

.satellite.left {
  left: 50px;
  top: 270px;
}

.satellite-body {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
}

.solar-panel {
  width: 18px;
  height: 32px;
  background:
    linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%),
    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  border: 1px solid #0f172a;
  position: relative;
  border-radius: 3px;
  box-shadow:
    inset 0 2px 4px rgba(255,255,255,0.3),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    0 4px 8px rgba(0,0,0,0.4),
    0 0 10px rgba(59,130,246,0.3);
  transform: perspective(100px) rotateX(5deg);
}

.panel-cells {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0.2) 0px,
      rgba(255,255,255,0.2) 2px,
      rgba(255,255,255,0.05) 2px,
      rgba(255,255,255,0.05) 4px,
      rgba(255,255,255,0.15) 4px,
      rgba(255,255,255,0.15) 6px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.15) 0px,
      rgba(255,255,255,0.15) 1px,
      transparent 1px,
      transparent 3px
    ),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 2px;
  animation: solarGlow 3s ease-in-out infinite alternate;
}

@keyframes solarGlow {
  0% { filter: brightness(1) saturate(1); }
  100% { filter: brightness(1.1) saturate(1.2); }
}

.satellite-core {
  width: 24px;
  height: 24px;
  background:
    linear-gradient(135deg, #1f2937 0%, #374151 25%, #4b5563 50%, #6b7280 75%, #9ca3af 100%),
    radial-gradient(circle at 30% 30%, rgba(251,191,36,0.3) 0%, transparent 70%);
  border: 2px solid #f59e0b;
  border-radius: 4px;
  position: relative;
  margin: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 2px 4px rgba(255,255,255,0.2),
    inset 0 -2px 4px rgba(0,0,0,0.3),
    0 0 15px rgba(245,158,11,0.5),
    0 4px 8px rgba(0,0,0,0.5),
    0 0 25px rgba(251,191,36,0.3);
  transform: perspective(50px) rotateX(10deg);
}

.core-light {
  width: 8px;
  height: 8px;
  background:
    radial-gradient(circle at 30% 30%, #34d399 0%, #10b981 50%, #047857 100%);
  border-radius: 50%;
  animation: corePulse 2s ease-in-out infinite;
  box-shadow:
    0 0 15px #10b981,
    0 0 25px rgba(16,185,129,0.6),
    inset 0 1px 2px rgba(255,255,255,0.3);
  position: relative;
}

.core-light::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 3px;
  height: 3px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  animation: corePulse 2s ease-in-out infinite reverse;
}

@keyframes corePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow:
      0 0 15px #10b981,
      0 0 25px rgba(16,185,129,0.6),
      inset 0 1px 2px rgba(255,255,255,0.3);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
    box-shadow:
      0 0 25px #10b981,
      0 0 40px rgba(16,185,129,0.8),
      inset 0 1px 2px rgba(255,255,255,0.5);
  }
}

.antenna-dish {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 6px;
  background: linear-gradient(45deg, #d1d5db, #9ca3af);
  border-radius: 50% 50% 0 0;
  border: 1px solid #6b7280;
}

.satellite-antenna {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 8px;
  background: #9ca3af;
}

.satellite-antenna::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -2px;
  width: 5px;
  height: 3px;
  background: #fbbf24;
  border-radius: 50%;
}



/* Enhanced Context Menu */
.context-menu {
  position: absolute;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow:
    0 20px 40px rgba(0,0,0,0.6),
    0 0 20px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.1);
  z-index: 1000;
  min-width: 110px;
  backdrop-filter: blur(15px);
  animation: menuFadeIn 0.2s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.menu-arrow.top {
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-arrow.right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid rgba(17, 24, 39, 0.95);
}

.menu-items {
  padding: 6px 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 18px;
  color: #f9fafb;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  border-radius: 6px;
  margin: 2px 4px;
  position: relative;
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.3));
  color: #ffffff;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.menu-item:active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(99, 102, 241, 0.5));
  transform: translateX(1px);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

/* Function Buttons */
.function-buttons {
  position: fixed;
  top: 30px;
  left: 200px;
  z-index: 1000;
  display: flex;
  gap: 15px;
}

.function-btn {
  padding: 12px 20px;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid #374151;
  border-radius: 10px;
  color: #f9fafb;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.function-btn:hover {
  background: rgba(31, 41, 55, 0.9);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.upload-btn:hover {
  border-color: #10b981;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.query-btn:hover {
  border-color: #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* Encryption Panel Styles */
.encryption-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  max-height: calc(100vh - 40px);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  overflow-y: auto;
  z-index: 100;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  color: #60a5fa;
  font-size: 18px;
  text-align: center;
}

.function-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.function-tab {
  padding: 10px 15px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid #475569;
  border-radius: 8px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.function-tab:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: #60a5fa;
}

.function-tab.active {
  background: rgba(59, 130, 246, 0.6);
  border-color: #60a5fa;
  color: white;
}

.function-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.node-selection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-selection label {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 5px;
}

.node-select {
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

.node-select:focus {
  outline: none;
  border-color: #60a5fa;
}

.message-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-input label {
  font-size: 14px;
  color: #cbd5e1;
}

.message-field {
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

.message-field:focus {
  outline: none;
  border-color: #60a5fa;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.encrypt-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.encrypt-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #059669);
}

.send-btn {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.decrypt-btn {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
}

.decrypt-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
}

.tamper-btn {
  background: linear-gradient(135deg, #ea580c, #f97316);
  color: white;
}

.tamper-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c2410c, #ea580c);
}

.unauthorized-btn {
  background: linear-gradient(135deg, #7c2d12, #a16207);
  color: white;
}

.unauthorized-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #651a0b, #7c2d12);
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cipher-result {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cipher-result label {
  font-size: 14px;
  color: #cbd5e1;
  font-weight: 500;
}

.cipher-text {
  padding: 10px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #475569;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #fbbf24;
  word-break: break-all;
  max-height: 80px;
  overflow-y: auto;
}

.cipher-text.tampered {
  color: #f87171;
  border-color: #dc2626;
}

.operation-result {
  padding: 12px;
  background: rgba(30, 41, 59, 0.4);
  border-left: 4px solid #60a5fa;
  border-radius: 6px;
  font-size: 14px;
  color: #e2e8f0;
  line-height: 1.4;
}

/* Query Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.query-modal {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.8);
  backdrop-filter: blur(20px);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(31, 41, 55, 0.5);
}

.modal-header h3 {
  margin: 0;
  color: #f9fafb;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #f9fafb;
  background: rgba(239, 68, 68, 0.2);
}

.modal-content {
  padding: 25px;
  max-height: 60vh;
  overflow-y: auto;
}

.query-input-section {
  margin-bottom: 25px;
}

.query-input-section label {
  display: block;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 10px;
}

.query-input {
  width: 100%;
  padding: 12px 15px;
  font-size: 1rem;
  border: 2px solid #374151;
  border-radius: 10px;
  background: rgba(31, 41, 55, 0.8);
  color: #f9fafb;
  transition: all 0.3s ease;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.query-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.submit-query-btn {
  padding: 12px 25px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.submit-query-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
}

.query-results-section h4 {
  color: #f3f4f6;
  font-size: 1.1rem;
  margin-bottom: 15px;
  border-bottom: 1px solid #374151;
  padding-bottom: 10px;
}

.results-container {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
  padding: 15px;
}

.loading {
  text-align: center;
  color: #3b82f6;
  font-size: 1rem;
  padding: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.no-results {
  text-align: center;
  color: #9ca3af;
  font-size: 1rem;
  padding: 20px;
  font-style: italic;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  background: rgba(55, 65, 81, 0.6);
  border: 1px solid #4b5563;
  border-radius: 8px;
  padding: 12px 15px;
  color: #f9fafb;
  font-size: 0.95rem;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.result-item:hover {
  background: rgba(75, 85, 99, 0.8);
  border-color: #6b7280;
}

/* Scrollbar Styling */
.results-container::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track,
.modal-content::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.8);
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb:hover,
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.9);
}
</style>