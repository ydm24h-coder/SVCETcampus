import CryptoJS from 'crypto-js';

const SECRET_KEY = 'svcet_secure_key_2026';

// In-memory cache to prevent heavy AES decryption on every render
const decryptionCache = new Map();
const rawStorageCache = new Map();

// Store original methods
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);

export const secureSetItem = (key, value) => {
  if (!key.startsWith('svcet_')) {
    return originalSetItem(key, value);
  }
  try {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    // Pre-warm the cache so immediate getItems are instantly O(1)
    rawStorageCache.set(key, encrypted);
    decryptionCache.set(key, value);
    originalSetItem(key, encrypted);
  } catch (error) {
    console.error('Error encrypting local storage:', error);
    originalSetItem(key, value);
  }
};

export const secureGetItem = (key) => {
  const item = originalGetItem(key);
  if (!item || !key.startsWith('svcet_')) return item;

  // O(1) Cache return if the underlying localStorage hasn't changed
  if (rawStorageCache.get(key) === item) {
    return decryptionCache.get(key);
  }

  try {
    // Check if it's an encrypted string (CryptoJS AES strings start with U2FsdGVkX1)
    if (item.startsWith('U2FsdGVkX1')) {
      const bytes = CryptoJS.AES.decrypt(item, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      const result = decrypted || item; // Fallback to raw if decryption fails to yield string
      
      // Save to cache for future renders
      rawStorageCache.set(key, item);
      decryptionCache.set(key, result);
      
      return result;
    }
    return item;
  } catch (error) {
    console.error('Error decrypting local storage:', error);
    return item;
  }
};

export const monkeyPatchLocalStorage = () => {
  localStorage.setItem = secureSetItem;
  localStorage.getItem = secureGetItem;
};
