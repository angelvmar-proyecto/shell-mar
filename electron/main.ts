import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// 1. Limpiar variable que podría forzar modo Node (ventana invisible)
delete process.env.ELECTRON_RUN_AS_NODE;

// 2. Función para forzar la ventana visible (Solución a Focus Stealing)
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
    mainWindow.once('ready-to-show', () => {
      ensureWindowVisible(mainWindow);
    });
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
