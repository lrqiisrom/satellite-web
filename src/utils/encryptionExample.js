/**
 * 加密服务使用示例
 * 展示如何在其他模块中使用解耦的AES-256加密功能
 */

import cryptoService from './cryptoService'

/**
 * 消息加密示例
 */
export async function encryptMessage(message, senderId, receiverId) {
  try {
    console.log(`开始加密消息: "${message}" (发送方: ${senderId} -> 接收方: ${receiverId})`)
    
    // 构造包含元数据的消息
    const messageWithMeta = {
      content: message,
      sender: senderId,
      receiver: receiverId,
      timestamp: Date.now(),
      type: 'message'
    }
    
    // 加密消息
    const encryptedHex = await cryptoService.encryptText(JSON.stringify(messageWithMeta))
    
    console.log('消息加密成功')
    return {
      success: true,
      ciphertext: encryptedHex,
      metadata: {
        sender: senderId,
        receiver: receiverId,
        timestamp: messageWithMeta.timestamp
      }
    }
  } catch (error) {
    console.error('消息加密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 消息解密示例
 */
export async function decryptMessage(encryptedHex, expectedReceiver) {
  try {
    console.log(`开始解密消息 (期望接收方: ${expectedReceiver})`)
    
    // 验证密文格式
    if (!cryptoService.validateCiphertext(encryptedHex)) {
      throw new Error('无效的密文格式')
    }
    
    // 解密消息
    const decryptedJson = await cryptoService.decryptHex(encryptedHex)
    const messageData = JSON.parse(decryptedJson)
    
    // 验证接收方身份
    if (messageData.receiver !== expectedReceiver) {
      throw new Error('接收方身份验证失败')
    }
    
    console.log('消息解密成功')
    return {
      success: true,
      message: messageData.content,
      sender: messageData.sender,
      timestamp: messageData.timestamp,
      type: messageData.type
    }
  } catch (error) {
    console.error('消息解密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 批量数据加密示例
 */
export async function encryptBatchData(dataArray, batchId) {
  try {
    console.log(`开始批量加密 ${dataArray.length} 条数据 (批次ID: ${batchId})`)
    
    // 为每条数据添加批次信息
    const dataWithBatch = dataArray.map((data, index) => ({
      batchId,
      index,
      data,
      timestamp: Date.now()
    }))
    
    // 批量加密
    const encryptedData = await cryptoService.encryptBatch(
      dataWithBatch.map(item => JSON.stringify(item))
    )
    
    console.log('批量加密完成')
    return {
      success: true,
      batchId,
      encryptedCount: encryptedData.length,
      encryptedData
    }
  } catch (error) {
    console.error('批量加密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 批量数据解密示例
 */
export async function decryptBatchData(encryptedArray, expectedBatchId) {
  try {
    console.log(`开始批量解密 ${encryptedArray.length} 条数据 (期望批次ID: ${expectedBatchId})`)
    
    // 批量解密
    const decryptedData = await cryptoService.decryptBatch(encryptedArray)
    
    // 解析并验证数据
    const parsedData = decryptedData.map(jsonStr => {
      const data = JSON.parse(jsonStr)
      if (data.batchId !== expectedBatchId) {
        throw new Error(`批次ID不匹配: 期望 ${expectedBatchId}, 实际 ${data.batchId}`)
      }
      return data
    })
    
    // 按索引排序
    parsedData.sort((a, b) => a.index - b.index)
    
    console.log('批量解密完成')
    return {
      success: true,
      batchId: expectedBatchId,
      decryptedCount: parsedData.length,
      data: parsedData.map(item => item.data)
    }
  } catch (error) {
    console.error('批量解密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 区块链数据加密示例
 */
export async function encryptBlockchainData(blockData, blockId) {
  try {
    console.log(`开始加密区块数据 (区块ID: ${blockId})`)
    
    // 构造区块数据结构
    const blockWithMeta = {
      blockId,
      data: blockData,
      timestamp: Date.now(),
      hash: await generateSimpleHash(JSON.stringify(blockData)),
      type: 'blockchain_block'
    }
    
    // 加密区块数据
    const encryptedHex = await cryptoService.encryptText(JSON.stringify(blockWithMeta))
    
    console.log('区块数据加密成功')
    return {
      success: true,
      blockId,
      encryptedBlock: encryptedHex,
      hash: blockWithMeta.hash
    }
  } catch (error) {
    console.error('区块数据加密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 区块链数据解密示例
 */
export async function decryptBlockchainData(encryptedHex, expectedBlockId) {
  try {
    console.log(`开始解密区块数据 (期望区块ID: ${expectedBlockId})`)
    
    // 解密区块数据
    const decryptedJson = await cryptoService.decryptHex(encryptedHex)
    const blockData = JSON.parse(decryptedJson)
    
    // 验证区块ID
    if (blockData.blockId !== expectedBlockId) {
      throw new Error(`区块ID不匹配: 期望 ${expectedBlockId}, 实际 ${blockData.blockId}`)
    }
    
    // 验证数据完整性
    const calculatedHash = await generateSimpleHash(JSON.stringify(blockData.data))
    if (calculatedHash !== blockData.hash) {
      throw new Error('区块数据完整性验证失败')
    }
    
    console.log('区块数据解密成功')
    return {
      success: true,
      blockId: blockData.blockId,
      data: blockData.data,
      timestamp: blockData.timestamp,
      hash: blockData.hash
    }
  } catch (error) {
    console.error('区块数据解密失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 简单哈希函数（用于演示）
 */
async function generateSimpleHash(data) {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 加密服务状态检查
 */
export function checkCryptoServiceStatus() {
  return {
    available: typeof crypto !== 'undefined' && crypto.subtle,
    algorithms: ['AES-GCM'],
    keyLength: 256,
    serviceReady: true
  }
}

/**
 * 使用示例函数
 */
export async function demonstrateUsage() {
  console.log('=== 加密服务使用演示 ===')
  
  try {
    // 1. 基本消息加密解密
    console.log('\n1. 基本消息加密解密测试')
    const messageResult = await encryptMessage('Hello Satellite!', 'sat1', 'sat2')
    if (messageResult.success) {
      const decryptResult = await decryptMessage(messageResult.ciphertext, 'sat2')
      console.log('解密结果:', decryptResult)
    }
    
    // 2. 批量数据处理
    console.log('\n2. 批量数据处理测试')
    const batchData = ['data1', 'data2', 'data3']
    const batchEncryptResult = await encryptBatchData(batchData, 'batch001')
    if (batchEncryptResult.success) {
      const batchDecryptResult = await decryptBatchData(batchEncryptResult.encryptedData, 'batch001')
      console.log('批量解密结果:', batchDecryptResult)
    }
    
    // 3. 区块链数据处理
    console.log('\n3. 区块链数据处理测试')
    const blockData = { transactions: ['tx1', 'tx2'], merkleRoot: 'abc123' }
    const blockEncryptResult = await encryptBlockchainData(blockData, 'block001')
    if (blockEncryptResult.success) {
      const blockDecryptResult = await decryptBlockchainData(blockEncryptResult.encryptedBlock, 'block001')
      console.log('区块解密结果:', blockDecryptResult)
    }
    
    console.log('\n=== 演示完成 ===')
  } catch (error) {
    console.error('演示过程中发生错误:', error)
  }
}