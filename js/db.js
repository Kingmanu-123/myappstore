// Lightweight IndexedDB wrapper. Two stores:
//  - "apps": imported HTML/CSS/JS app bundles (files map + metadata)
//  - "kv":   settings (GitHub token, repo, auto-upload flag, etc.)
const DB_NAME = "mystore-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("apps")) {
        db.createObjectStore("apps", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const DB = {
  async putApp(app) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("apps", "readwrite");
      tx.objectStore("apps").put(app);
      tx.oncomplete = () => res(app);
      tx.onerror = () => rej(tx.error);
    });
  },
  async getAllApps() {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("apps", "readonly");
      const req = tx.objectStore("apps").getAll();
      req.onsuccess = () => res(req.result.sort((a, b) => b.createdAt - a.createdAt));
      req.onerror = () => rej(req.error);
    });
  },
  async getApp(id) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("apps", "readonly");
      const req = tx.objectStore("apps").get(id);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  },
  async deleteApp(id) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("apps", "readwrite");
      tx.objectStore("apps").delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  },
  async setKV(key, value) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ key, value });
      tx.oncomplete = () => res(value);
      tx.onerror = () => rej(tx.error);
    });
  },
  async getKV(key, fallback = null) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => res(req.result ? req.result.value : fallback);
      req.onerror = () => rej(req.error);
    });
  },
};
