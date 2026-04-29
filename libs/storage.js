/**
 * Storage wrapper for chrome.storage.local
 */
export const storage = {
  /**
   * Save data to storage
   * @param {Object} data - Key-value pairs to save
   * @returns {Promise<void>}
   */
  set: (data) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Get data from storage
   * @param {string|string[]|Object|null} keys - Keys to retrieve
   * @returns {Promise<Object>}
   */
  get: (keys) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Remove data from storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  remove: (keys) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Clear all data from storage
   * @returns {Promise<void>}
   */
  clear: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
};
