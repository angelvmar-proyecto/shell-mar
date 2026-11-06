import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Aumentar el límite de memoria para V8
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

app.whenReady().then(() => {
  const capApp = createCapacitorElectronApp();
  
  // Usar el método getMainWindow() en lugar de la propiedad mainWindow
  const mainWindow: BrowserWindow | undefined = capApp.getMainWindow();

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
