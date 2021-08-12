const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
autoUpdater.logger = require('electron-log');

// 监听输出的日志
autoUpdater.logger.transports.file.level = 'info'
// 设置当前的版本号为自动更新的版本号

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  mainWindow.loadFile(`${__dirname}/index.html`);
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  // check update
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
autoUpdater.on('error', (error) => {
    mainWindow.webContents.send(error);
})
autoUpdater.on('checking-for-update', function () {
    mainWindow.webContents.send('checking-for-update');
})
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
    autoUpdater.downloadUpdate()
});
autoUpdater.on('update-not-available', function (info) {
    mainWindow.webContents.send('update-not-available');
})
autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send(progressObj);
})
autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

