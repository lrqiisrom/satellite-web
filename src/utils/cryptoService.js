/**
 * AES-256-GCM 加密服务模块
 * 提供统一的加密、解密功能，支持多模块复用
 */

class CryptoService {
  constructor() {
    this.aesKey = null
    this.keyMaterial = 'satellite-blockchain-2024-aes-key-material'
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
  }

  /**
   * 初始化AES密钥
   * @returns {Promise<void>}
   */
  async initializeKey() {
    if (this.aesKey) return

    try {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(this.keyMaterial)
      
      // 导入密钥材料
      const importedKey = await crypto.subtle.importKey(
        'raw',
        keyData.slice(0, 32), // 取前32字节作为密钥
        { name: this.algorithm },
        false,
        ['encrypt', 'decrypt']
      )
      
      this.aesKey = importedKey
    } catch (error) {
      console.error('密钥初始化失败:', error)
      throw new Error('加密服务初始化失败')
    }
  }

  /**
   * 加密文本数据
   * @param {string} plaintext - 要加密的明文
   * @returns {Promise<string>} 十六进制格式的密文
   */
  async encryptText(plaintext) {
    await this.initializeKey()
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(plaintext)
      
      // 生成随机IV
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      // 执行加密
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.aesKey,
        data
      )
      
      // 将IV和密文合并
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      
      // 转换为十六进制字符串
      return Array.from(combined)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } catch (error) {
      console.error('加密失败:', error)
      throw new Error('数据加密失败')
    }
  }

  /**
   * 解密十六进制密文
   * @param {string} hexCiphertext - 十六进制格式的密文
   * @returns {Promise<string>} 解密后的明文
   */
  async decryptHex(hexCiphertext) {
    await this.initializeKey()
    
    try {
      // 将十六进制字符串转换为字节数组
      const combined = new Uint8Array(
        hexCiphertext.match(/.{2}/g).map(byte => parseInt(byte, 16))
      )
      
      // 提取IV和密文
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)
      
      // 执行解密
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.aesKey,
        ciphertext
      )
      
      // 转换为字符串
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('解密失败:', error)
      throw new Error('数据解密失败')
    }
  }

  /**
   * 批量加密文本数组
   * @param {string[]} plaintexts - 要加密的明文数组
   * @returns {Promise<string[]>} 加密后的密文数组
   */
  async encryptBatch(plaintexts) {
    const results = []
    for (const text of plaintexts) {
      results.push(await this.encryptText(text))
    }
    return results
  }

  /**
   * 批量解密密文数组
   * @param {string[]} ciphertexts - 要解密的密文数组
   * @returns {Promise<string[]>} 解密后的明文数组
   */
  async decryptBatch(ciphertexts) {
    const results = []
    for (const cipher of ciphertexts) {
      results.push(await this.decryptHex(cipher))
    }
    return results
  }

  /**
   * 验证密文完整性
   * @param {string} hexCiphertext - 十六进制格式的密文
   * @returns {boolean} 是否为有效的密文格式
   */
  validateCiphertext(hexCiphertext) {
    if (!hexCiphertext || typeof hexCiphertext !== 'string') {
      return false
    }
    
    // 检查是否为有效的十六进制字符串
    if (!/^[0-9a-fA-F]+$/.test(hexCiphertext)) {
      return false
    }
    
    // 检查长度是否合理（至少包含12字节IV + 最小密文长度）
    if (hexCiphertext.length < 24) {
      return false
    }
    
    return true
  }

  /**
   * 清理敏感数据
   */
  destroy() {
    this.aesKey = null
  }
}

// 创建单例实例
const cryptoService = new CryptoService()

// 导出服务实例和类
export default cryptoService
export { CryptoService }

// 兼容性导出（支持旧的函数调用方式）
export const encryptToHex = (plaintext) => cryptoService.encryptText(plaintext)
export const decryptHexCipher = (hexCiphertext) => cryptoService.decryptHex(hexCiphertext)
export const generateHexCipher = (plaintext) => cryptoService.encryptText(plaintext)