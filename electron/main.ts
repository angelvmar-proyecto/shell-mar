import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Función para forzar la visibilidad (solución a Focus Stealing en Windows)
function ensureWindowVisible(window: BrowserWindow) {
  if (!window) return;
  // Si está minimizada, restaurar
  if (window.isMinimized()) {
    window.restore();
  }
  // Si no es visible, mostrarla
  if (!window.isVisible()) {
    window.show();
  }
  // Forzar foco (sin el hack de alwaysOnTop que a veces causa parpadeos)
  window.focus();
}

app.whenReady().then(() => {
  const capApp = createCapacitorElectronApp();
  const mainWindow = capApp.getMainWindow();

  if (mainWindow) {
    // Escuchar el evento 'ready-to-show' que se dispara cuando el contenido web está listo
    // Esto es más fiable que usar un setTimeout fijo
    mainWindow.once('ready-to-show', () => {
      ensureWindowVisible(mainWindow);
    });

    // Por si acaso 'ready-to-show' ya se disparó (en caso de que el contenido sea muy rápido)
    // Ejecutamos la verificación con un pequeño retraso
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
