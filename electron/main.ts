import { app, BrowserWindow } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

// Limpiar la variable que fuerza a Electron a modo Node (causa ventana invisible)
delete process.env.ELECTRON_RUN_AS_NODE;

app.whenReady().then(() => {
  // Crear la app forzando que la ventana sea visible desde el inicio
  const capApp = createCapacitorElectronApp({
    mainWindowOptions: {
      show: true,        // <-- FORZAR VISIBLE
      focusable: true,   // <-- FORZAR ENFOCABLE
      width: 1280,
      height: 800
    }
  });

  const mainWindow = capApp.getMainWindow();

  if (mainWindow) {
    // Por si acaso, forzar de nuevo después de un pequeño retraso
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
