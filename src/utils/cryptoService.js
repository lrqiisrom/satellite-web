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
    this.keyCache = new Map()
  }

  // 特性检测
  isSubtleAvailable() {
    const g = typeof window !== 'undefined' ? window : {}
    return !!(g && g.isSecureContext && g.crypto && g.crypto.subtle)
  }

  isGetRandomValuesAvailable() {
    const g = typeof window !== 'undefined' ? window : {}
    return !!(g && g.crypto && typeof g.crypto.getRandomValues === 'function')
  }会发誓hi和iu好

  getRandomBytes(length) {
    const bytes = new Uint8Array(length)
    if (this.isGetRandomValuesAvailable()) {
      const g = typeof window !== 'undefined' ? window : {}
      g.crypto.getRandomValues(bytes)
      return bytes
    }
    // 退化到 Math.random（非安全，仅用于演示/非安全环境）
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
    return bytes
  }

  bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  hexToBytes(hex) {
    if (!hex || typeof hex !== 'string') return new Uint8Array(0)
    const arr = new Uint8Array(hex.length / 2)
    for (let i = 0; i < arr.length; i++) {
      arr[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return arr
  }

  deriveKeyBytesFromString(str, length = 32) {
    // 简单可逆的派生（非加密强度，仅用于非安全环境演示）
    const out = new Uint8Array(length)
    let a = 0x12, b = 0x34, c = 0x56, d = 0x78
    for (let i = 0; i < str.length; i++) {
      const x = str.charCodeAt(i)
      a = (a ^ x) & 0xff
      b = (b + x) & 0xff
      c = ((c << 1) | (c >>> 7)) & 0xff
      d = (d + ((x << (i % 5)) & 0xff)) & 0xff
    }
    for (let i = 0; i < length; i++) {
      out[i] = (a + b + c + d + i * 97) & 0xff
      a = (a + 13) & 0xff
      b = (b ^ 0x5a) & 0xff
      c = (c + 29) & 0xff
      d = (d ^ 0xa5) & 0xff
    }
    return out
  }

  xorWithStream(dataBytes, ivBytes, keyBytes) {
    const out = new Uint8Array(dataBytes.length)
    for (let i = 0; i < dataBytes.length; i++) {
      const ks = keyBytes[i % keyBytes.length] ^ ivBytes[i % ivBytes.length]
      out[i] = dataBytes[i] ^ ks
    }
    return out
  }

  async getCryptoKeyFromString(keyString) {
    if (!this.isSubtleAvailable()) return null
    if (this.keyCache.has(keyString)) return this.keyCache.get(keyString)
    const raw = new TextEncoder().encode(keyString).slice(0, 32)
    const cryptoKey = await crypto.subtle.importKey('raw', raw, { name: this.algorithm }, false, ['encrypt', 'decrypt'])
    this.keyCache.set(keyString, cryptoKey)
    return cryptoKey
  }

  /**
   * 初始化AES密钥
   * @returns {Promise<void>}
   */
  async initializeKey() {
    if (!this.isSubtleAvailable()) {
      this.aesKey = null
      return
    }
    if (this.aesKey) return

    try {
      this.aesKey = await this.getCryptoKeyFromString(this.keyMaterial)
    } catch (error) {
      console.error('密钥初始化失败:', error)
      throw new Error('加密服务初始化失败')
    }
  }

  /**
   * 加密文本数据
   * @param {string} plaintext - 要加密的明文
   * @param {string} [key] - 可选的密钥字符串（用于不同卫星对）
   * @returns {Promise<string>} 十六进制格式的密文
   */
  async encryptText(plaintext, key) {
    // 当 subtle 可用时使用 AES-GCM，否则使用降级方案（仅演示用途）
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    const iv = this.getRandomBytes(12)

    if (this.isSubtleAvailable()) {
      const cryptoKey = key ? await this.getCryptoKeyFromString(key) : (await this.initializeKey(), this.aesKey)

      try {
        const encrypted = await crypto.subtle.encrypt(
          { name: this.algorithm, iv },
          cryptoKey,
          data
        )

        const combined = new Uint8Array(iv.length + encrypted.byteLength)
        combined.set(iv)
        combined.set(new Uint8Array(encrypted), iv.length)
        return this.bytesToHex(combined)
      } catch (error) {
        console.error('加密失败:', error)
        throw new Error('数据加密失败')
      }
    } else {
      // 降级：使用简单 XOR 流（非安全，仅在非安全上下文中用于演示）
      const keyBytes = this.deriveKeyBytesFromString(key || this.keyMaterial, 32)
      const cipherBytes = this.xorWithStream(data, iv, keyBytes)
      const combined = new Uint8Array(iv.length + cipherBytes.length)
      combined.set(iv)
      combined.set(cipherBytes, iv.length)
      return this.bytesToHex(combined)
    }
  }

  /**
   * 解密十六进制密文
   * @param {string} hexCiphertext - 十六进制格式的密文
   * @param {string} [key] - 可选的密钥字符串（用于不同卫星对）
   * @returns {Promise<string>} 解密后的明文
   */
  async decryptHex(hexCiphertext, key) {
    await this.initializeKey()

    try {
      const combined = this.hexToBytes(hexCiphertext)
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)

      if (this.isSubtleAvailable()) {
        const cryptoKey = key ? await this.getCryptoKeyFromString(key) : this.aesKey
        const decrypted = await crypto.subtle.decrypt(
          { name: this.algorithm, iv },
          cryptoKey,
          ciphertext
        )
        const decoder = new TextDecoder()
        return decoder.decode(decrypted)
      } else {
        const keyBytes = this.deriveKeyBytesFromString(key || this.keyMaterial, 32)
        const plainBytes = this.xorWithStream(ciphertext, iv, keyBytes)
        const decoder = new TextDecoder()
        return decoder.decode(plainBytes)
      }
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
   * 生成随机密钥
   * @returns {string} 随机生成的密钥
   */
  generateRandomKey() {
    const randomBytes = this.getRandomBytes(32)
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
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