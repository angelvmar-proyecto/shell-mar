import { app } from 'electron';
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
    mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.destroy();
      process.kill(process.pid, 'SIGINT');
    });
  }
});

app.on('window-all-closed', () => {
  process.kill(process.pid, 'SIGINT');
});
