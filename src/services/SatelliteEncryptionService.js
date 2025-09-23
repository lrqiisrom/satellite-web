/**
 * 卫星加密服务
 * 提供卫星系统中的加密、解密和密钥管理功能
 */
import { CryptoService } from '@/utils/cryptoService'

class SatelliteEncryptionService {
  constructor() {
    this.cryptoService = new CryptoService()
    // 存储每个卫星对的密钥
    this.satelliteKeys = {}
    // 存储消息元数据
    this.messageMetadata = {}
  }

  /**
   * 为卫星对生成或获取密钥
   * @param {Number} senderIndex - 发送方卫星索引
   * @param {Number} receiverIndex - 接收方卫星索引
   * @returns {String} - 密钥
   */
  getKeyForSatellitePair(senderIndex, receiverIndex) {
    const keyId = `${senderIndex}-${receiverIndex}`
    
    if (!this.satelliteKeys[keyId]) {
      // 为新的卫星对生成密钥
      this.satelliteKeys[keyId] = this.cryptoService.generateRandomKey()
    }
    
    return this.satelliteKeys[keyId]
  }

  /**
   * 加密消息
   * @param {Object} params - 加密参数
   * @param {Number} params.senderIndex - 发送方卫星索引
   * @param {Number} params.receiverIndex - 接收方卫星索引
   * @param {String} params.message - 要加密的消息
   * @returns {Promise<String>} - 加密后的密文
   */
  async encryptMessage({ senderIndex, receiverIndex, message }) {
    // 获取或生成密钥
    const key = this.getKeyForSatellitePair(senderIndex, receiverIndex)
    
    // 检查消息是否包含多个关键字（以逗号分隔）
    if (message.includes(',')) {
      // 分割关键字
      const keywords = message.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== '')
      
      // 分别加密每个关键字
      const encryptedKeywords = await Promise.all(
        keywords.map(async (keyword) => {
          const ciphertext = await this.cryptoService.encryptText(keyword, key)
          
          // 为每个关键字存储元数据
          const messageId = Date.now().toString() + Math.random().toString(36).substring(2, 15)
          this.messageMetadata[ciphertext] = {
            id: messageId,
            senderIndex,
            receiverIndex,
            timestamp: Date.now()
          }
          
          return ciphertext
        })
      )
      
      // 返回所有加密关键字，用换行符连接
      return encryptedKeywords.join('\n')
    } else {
      // 单个关键字的情况，保持原有逻辑
      const ciphertext = await this.cryptoService.encryptText(message, key)
      
      // 存储消息元数据
      const messageId = Date.now().toString() + Math.random().toString(36).substring(2, 15)
      this.messageMetadata[ciphertext] = {
        id: messageId,
        senderIndex,
        receiverIndex,
        timestamp: Date.now()
      }
      
      return ciphertext
    }
  }

  /**
   * 解密消息
   * @param {Object} params - 解密参数
   * @param {Number} params.satelliteIndex - 当前卫星索引
   * @param {String} params.ciphertext - 要解密的密文
   * @param {Number} params.senderIndex - 发送方卫星索引
   * @param {Number} params.receiverIndex - 接收方卫星索引
   * @returns {Promise<Object>} - 解密结果
   */
  async decryptMessage({ satelliteIndex, ciphertext, senderIndex, receiverIndex }) {
    // 检查是否有权限解密（接收方或发送方都有权限）
    if (satelliteIndex !== receiverIndex && satelliteIndex !== senderIndex) {
      return {
        success: false,
        message: null,
        error: '无权解密此消息'
      }
    }
    
    try {
      // 获取密钥
      const key = this.getKeyForSatellitePair(senderIndex, receiverIndex)
      
      // 检查是否是多行密文（多个关键字）
      if (ciphertext.includes('\n')) {
        // 分割多行密文
        const ciphertextLines = ciphertext.split('\n')
        
        // 分别解密每行密文
        const decryptedLines = await Promise.all(
          ciphertextLines.map(async (line) => {
            try {
              return await this.cryptoService.decryptHex(line, key)
            } catch (err) {
              console.error('解密单行密文失败:', err)
              return '[解密失败]'
            }
          })
        )
        
        // 将解密后的多个关键字用逗号连接
        const decryptedMessage = decryptedLines.join(', ')
        
        return {
          success: true,
          message: decryptedMessage,
          error: null
        }
      } else {
        // 单行密文的情况，保持原有逻辑
        const decryptedMessage = await this.cryptoService.decryptHex(ciphertext, key)
        
        return {
          success: true,
          message: decryptedMessage,
          error: null
        }
      }
    } catch (error) {
      return {
        success: false,
        message: null,
        error: '解密失败：' + error.message
      }
    }
  }

  /**
   * 获取消息元数据
   * @param {String} ciphertext - 密文
   * @returns {Object|null} - 消息元数据
   */
  getMessageMetadata(ciphertext) {
    return this.messageMetadata[ciphertext] || null
  }

  /**
   * 清除所有密钥和元数据
   */
  reset() {
    this.satelliteKeys = {}
    this.messageMetadata = {}
  }
}

// 创建单例实例
const satelliteEncryptionService = new SatelliteEncryptionService()

export default satelliteEncryptionService