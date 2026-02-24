const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onPriceUpdate: (callback) => {
    ipcRenderer.on('price-update', (_event, data) => callback(data));
  },
  onCoinsUpdate: (callback) => {
    ipcRenderer.on('coins-update', (_event, coins) => callback(coins));
  },
  closePopup:       () => ipcRenderer.send('close-popup'),
  togglePopup:      () => ipcRenderer.send('toggle-popup'),
  tickerDragStart:  (x, y) => ipcRenderer.send('ticker-drag-start', { x, y }),
  tickerDragMove:   (x, y) => ipcRenderer.send('ticker-drag-move',  { x, y }),
  tickerDragEnd:    ()     => ipcRenderer.send('ticker-drag-end'),
  expandTicker:     ()     => ipcRenderer.send('ticker-expand'),
  collapseTicker:   ()     => ipcRenderer.send('ticker-collapse'),
  resizePopup: (bounds)    => ipcRenderer.send('popup-resize', bounds),
});
