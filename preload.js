const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Game controls
  onPlayWinAnimation: (callback) => ipcRenderer.on('play-win-animation', callback),
  onResetAnimation: (callback) => ipcRenderer.on('reset-animation', callback),
  onNewGame: (callback) => ipcRenderer.on('new-game', callback),
  onToggleSettings: (callback) => ipcRenderer.on('toggle-settings', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
