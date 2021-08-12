const { ipcRenderer } = require('electron');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const progress = document.getElementById('progress');
const percent = document.getElementById('percent');
const restartButton = document.getElementById('restart-button');

ipcRenderer.on('error', (error) => {
  ipcRenderer.removeAllListeners('error');
  message.innerText = error.toString();
  notification.classList.remove('hidden');
});

ipcRenderer.on('checking-for-update', () => {
  ipcRenderer.removeAllListeners('checking-for-update');
  message.innerText = 'checking-for-update...';
  notification.classList.remove('hidden');
});

ipcRenderer.on('update_available', () => {
  ipcRenderer.removeAllListeners('update_available');
  message.innerText = 'A new update is available. Downloading now...';
  progress.classList.value = '90';
  percent.innerText = '1';
  notification.classList.remove('hidden');
  progress.classList.remove('hidden');
  percent.classList.remove('hidden');
});

ipcRenderer.on('update-not-available', () => {
  ipcRenderer.removeAllListeners('update-not-available');
  message.innerText = 'update not available, already newest version!';
  notification.classList.remove('hidden');
});

ipcRenderer.on('download-progress', (progressObj) => {
  message.innerText = 'Downloading now...';
  ipcRenderer.removeAllListeners('download-progress');
  progress.innerText = progressObj.percent.fixed(2);
  percent.innerText = progressObj.percent.fixed(2);
  notification.classList.remove('hidden');
  progress.classList.remove('hidden');
  percent.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', () => {
  ipcRenderer.removeAllListeners('update_downloaded');
  message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
  restartButton.classList.remove('hidden');
  notification.classList.remove('hidden');
});

function closeNotification() {
    notification.classList.add('hidden');
}

function restartApp() {
    ipcRenderer.send('restart_app');
}