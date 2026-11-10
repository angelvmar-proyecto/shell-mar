// Módulo de persistencia con IndexedDB
const DB_NAME = 'FiltradorMAR_DB';
const DB_VERSION = 1;
const STORE = 'sesiones';

let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function guardarSesionAuto(estado) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.put({ id: 'autoguardado', timestamp: Date.now(), estado });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function cargarSesionAuto() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get('autoguardado');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function borrarSesionAuto() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.delete('autoguardado');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Exportar para navegador
window.initDB = initDB;
window.guardarSesionAuto = guardarSesionAuto;
window.cargarSesionAuto = cargarSesionAuto;
window.borrarSesionAuto = borrarSesionAuto;
