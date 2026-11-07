import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// 1. Limpiar la variable que fuerza modo Node (causa ventana invisible)
delete process.env.ELECTRON_RUN_AS_NODE;

// 2. Función para forzar la ventana visible (solución a Focus Stealing en Windows)
function ensureWindowVisible(window: BrowserWindow) {
  if (!window || window.isDestroyed()) return;
  if (window.isMinimized()) window.restore();
  if (!window.isVisible()) window.show();
  window.focus();
}

app.whenReady().then(() => {
  const capApp = createCapacitorElectronApp();
  const mainWindow = capApp.getMainWindow();

  if (mainWindow) {
    // 3. Esperar a que el contenido esté listo y forzar la visibilidad
    mainWindow.once('ready-to-show', () => {
      ensureWindowVisible(mainWindow);
    });

    // 4. Seguro extra: forzar después de un tiempo por si ready-to-show no dispara
    setTimeout(() => {
      ensureWindowVisible(mainWindow);
    }, 1500);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
