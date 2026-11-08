const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'www', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Forzar el cierre inmediato de la app para evitar procesos colgados
  mainWindow.on('close', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
