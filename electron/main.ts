import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Limpiar variable que podría forzar modo Node (causa ventana invisible)
delete process.env.ELECTRON_RUN_AS_NODE;

app.whenReady().then(() => {
  // La configuración de la ventana (show: true) ya viene desde capacitor.electron.config.ts
  const capApp = createCapacitorElectronApp();
  const mainWindow = capApp.getMainWindow();

  if (mainWindow) {
    // Forzar foco después de un breve instante por si Windows lo ignora
    setTimeout(() => {
      mainWindow.show();
      mainWindow.focus();
    }, 500);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
