/**
 * UploadQueueManager - Manages sequential file uploads with Promise support
 * Solves the problem of concurrent uploads causing database lock issues
 * Provides a consistent interface for file upload queue management
 */
class UploadQueueManager {
  /**
   * Create an UploadQueueManager instance
   * @param {number} maxConcurrent - Maximum number of concurrent uploads (default: 1 for sequential)
   * @param {Function} uploadCallback - Async function that handles individual file upload
   *                                    Signature: async uploadCallback(file) => result
   */
  constructor(maxConcurrent = 1, uploadCallback = null) {
    this.queue = []
    this.active = 0
    this.maxConcurrent = maxConcurrent
    this.uploadCallback = uploadCallback
    this.isProcessing = false
    this.failedFiles = []
    this.successCount = 0
  }

  /**
   * Add a file to the upload queue
   * @param {Object} file - File object to upload
   * @returns {Promise} - Resolves when file upload completes
   */
  add(file) {
    return new Promise((resolve, reject) => {
      this.queue.push({ file, resolve, reject })
      // Start processing if not already processing
      if (!this.isProcessing) {
        this.process()
      }
    })
  }

  /**
   * Process the upload queue
   * Ensures orderly processing of files based on maxConcurrent setting
   * CRITICAL: Each callback must return a Promise that resolves only AFTER the
   * entire file processing is complete (not just metadata creation).
   */
  async process() {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      while (this.queue.length > 0 && this.active < this.maxConcurrent) {
        const { file, resolve, reject } = this.queue.shift()
        this.active++

        try {
          const result = await this._uploadFile(file)
          this.successCount++
          resolve(result)
        } catch (error) {
          this.failedFiles.push({ file, error })
          reject(error)
        } finally {
          this.active--
        }
      }
    } finally {
      // Only mark processing as complete when queue is empty and no active uploads
      if (this.queue.length === 0 && this.active === 0) {
        this.isProcessing = false
      }
    }
  }

  /**
   * Internal method to upload a single file
   * Can be overridden by subclasses or via constructor parameter
   * @private
   */
  async _uploadFile(file) {
    if (this.uploadCallback) {
      return await this.uploadCallback(file)
    }
    throw new Error('uploadCallback is not defined')
  }

  /**
   * Get the number of files in the queue
   * @returns {number}
   */
  getQueueLength() {
    return this.queue.length
  }

  /**
   * Get the number of active uploads
   * @returns {number}
   */
  getActiveCount() {
    return this.active
  }

  /**
   * Get all failed uploads
   * @returns {Array}
   */
  getFailedFiles() {
    return this.failedFiles
  }

  /**
   * Get the success count
   * @returns {number}
   */
  getSuccessCount() {
    return this.successCount
  }

  /**
   * Clear the queue and reset state
   */
  clear() {
    this.queue = []
    this.active = 0
    this.isProcessing = false
    this.failedFiles = []
    this.successCount = 0
  }

  /**
   * Get queue statistics
   * @returns {Object}
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeCount: this.active,
      successCount: this.successCount,
      failedCount: this.failedFiles.length,
      isProcessing: this.isProcessing
    }
  }
}

export default UploadQueueManager
