import { app } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Aumentar el límite de memoria para V8 (evita cuelgues con Excel grandes)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

app.whenReady().then(() => {
  createCapacitorElectronApp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
