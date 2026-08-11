const DB_NAME = 'svcet_attachments_db';
const STORE_NAME = 'attachments';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save an attachment to IndexedDB
 * @param {string} id - Unique identifier for the attachment
 * @param {File|Blob} file - The file to store
 * @param {string} name - File name
 * @returns {Promise<string>} - Returns the id on success
 */
export const saveAttachment = async (id, file, name) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store as Blob to ensure cross-browser compatibility
    const blob = new Blob([file], { type: file.type });
    const record = { id, blob, name, type: file.type, createdAt: Date.now() };
    
    const request = store.put(record);

    request.onsuccess = () => resolve(id);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Retrieve an attachment from IndexedDB
 * @param {string} id - The attachment identifier
 * @returns {Promise<Object|null>} - Returns the attachment record { blob, name, type } or null
 */
export const getAttachment = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve(null);
      }
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Create an object URL for viewing/downloading the attachment
 * @param {string} id 
 * @returns {Promise<string|null>} - Returns object URL or null
 */
export const getAttachmentUrl = async (id) => {
  try {
    const attachment = await getAttachment(id);
    if (attachment && attachment.blob) {
      return URL.createObjectURL(attachment.blob);
    }
    return null;
  } catch (error) {
    console.error('Failed to get attachment URL:', error);
    return null;
  }
};

/**
 * Delete an attachment
 * @param {string} id 
 */
export const deleteAttachment = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};
