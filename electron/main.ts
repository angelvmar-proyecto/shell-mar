import { app } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

app.whenReady().then(() => {
  createCapacitorElectronApp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
