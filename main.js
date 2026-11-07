const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Se crea oculta para que no parpadee al cargar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cargar tu app web
  mainWindow.loadFile(path.join(__dirname, 'www', 'index.html'));

  // Cuando esté lista, la mostramos y la enfocamos
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
