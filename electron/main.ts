import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

delete process.env.ELECTRON_RUN_AS_NODE;

app.whenReady().then(() => {
  const capApp = createCapacitorElectronApp();
  const mainWindow = capApp.getMainWindow();

  if (mainWindow) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    // FORZAR CIERRE MATANDO EL PROCESO DE WINDOWS
    mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.destroy();
      process.kill(process.pid, 'SIGINT'); // Mata el proceso a nivel de sistema
    });
  }
});

app.on('window-all-closed', () => {
  process.kill(process.pid, 'SIGINT');
});
