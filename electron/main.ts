import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Aumentar el límite de memoria para V8 (evita cuelgues con Excel grandes)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

let mainWindow: BrowserWindow | undefined;

app.whenReady().then(() => {
  const capApp = createCapacitorElectronApp();
  mainWindow = capApp.mainWindow;

  // Forzar que la ventana se muestre y se traiga al frente
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setAlwaysOnTop(false);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
