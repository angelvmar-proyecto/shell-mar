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

    // FORZAR CIERRE: Ignorar cualquier proceso pendiente y destruir la ventana
    mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.destroy();
      app.exit(0);
    });
  }
});

app.on('window-all-closed', () => {
  app.exit(0);
});
