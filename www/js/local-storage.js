/* ===== local-storage.js =====
   Handle penyimpanan file media di perangkat pengguna (IndexedDB).
   Dikembangkan oleh Arjuna Mahendra.
   
   File media (foto/video) disimpan di HP user, bukan di Supabase.
   Supabase hanya untuk: auth, feed metadata, komentar, reaksi, lingkaran.
*/

const LocalStorage = {
  DB_NAME: "LingkarMedia",
  DB_VERSION: 1,
  STORE_NAME: "media",
  db: null,

  async init() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log("✅ IndexedDB siap");
        resolve();
      };

      request.onerror = (e) => {
        console.error("❌ IndexedDB error:", e);
        reject(e);
      };
    });
  },

  async saveFile(id, file) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);

      const reader = new FileReader();
      reader.onload = () => {
        const record = {
          id: id,
          type: file.type,
          name: file.name,
          size: file.size,
          data: reader.result,
          savedAt: new Date().toISOString()
        };

        const request = store.put(record);
        request.onsuccess = () => {
          const blob = new Blob([reader.result], { type: file.type });
          const url = URL.createObjectURL(blob);
          console.log(`📦 File disimpan lokal: ${id} (${(file.size/1024).toFixed(1)} KB)`);
          resolve(url);
        };
        request.onerror = (e) => reject(e);
      };

      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  },

  async getFile(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const blob = new Blob([request.result.data], { type: request.result.type });
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      request.onerror = (e) => reject(e);
    });
  },

  async deleteFile(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ File dihapus: ${id}`);
        resolve();
      };
      request.onerror = (e) => reject(e);
    });
  },

  async count() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e);
    });
  },

  async listAll() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e);
    });
  },

  /**
   * Hapus file lokal yang lebih dari N hari
   */
  async cleanupOld(days = 7) {
    await this.init();
    const all = await this.listAll();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    let deleted = 0;

    for (const record of all) {
      const savedAt = new Date(record.savedAt);
      if (savedAt < cutoff) {
        await this.deleteFile(record.id);
        deleted++;
      }
    }

    console.log(`🧹 Cleanup: ${deleted} file lama dihapus`);
    return deleted;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  LocalStorage.init();
});

console.log("%c Lingkar Local Storage ", 
  "background: #34c759; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");