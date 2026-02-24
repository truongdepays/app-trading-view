const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let tray = null;
let popupWindow = null;
let tickerWindow = null;
let ws = null;
let reconnectTimer = null;

const POPUP_MARGIN = 20;

const TICKER_COLLAPSED_W = 200;
const TICKER_COLLAPSED_H = 44;
const TICKER_EXPANDED_W  = 280;
const TICKER_EXPANDED_H  = 176; // 44px × 4 coins
const TICKER_MARGIN = 16;

const COINS_CONFIG = {
  btcusdt: { name: 'BTC', icon: '₿' },
  ethusdt: { name: 'ETH', icon: 'Ξ' },
  bnbusdt: { name: 'BNB', icon: '◈' },
  solusdt: { name: 'SOL', icon: '◎' },
};

const coinsMap = {};

function formatPrice(price) {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 10)   return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

app.whenReady().then(() => {
  // Ẩn khỏi dock/taskbar
  app.dock && app.dock.hide();

  createTray();
  createPopupWindow();
  createTickerWindow();
  connectBinanceWebSocket();
});

app.on('window-all-closed', (e) => {
  // Không quit khi đóng window — giữ app chạy nền
  e.preventDefault();
});

// ─── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.on('close-popup', () => {
  if (popupWindow) popupWindow.hide();
});

ipcMain.on('toggle-popup', () => {
  togglePopup();
});

// ─── Ticker drag ──────────────────────────────────────────────────────────────

let _dragStartMouse = null;
let _dragStartWinPos = null;

ipcMain.on('ticker-drag-start', (_, { x, y }) => {
  if (!tickerWindow) return;
  _dragStartMouse  = { x, y };
  _dragStartWinPos = tickerWindow.getPosition(); // [x, y]
});

ipcMain.on('ticker-drag-move', (_, { x, y }) => {
  if (!tickerWindow || !_dragStartMouse || !_dragStartWinPos) return;
  const dx = x - _dragStartMouse.x;
  const dy = y - _dragStartMouse.y;

  const [curW, curH] = tickerWindow.getSize();
  const va = getVirtualWorkArea();
  const newX = Math.round(Math.max(va.minX, Math.min(_dragStartWinPos[0] + dx, va.maxX - curW)));
  const newY = Math.round(Math.max(va.minY, Math.min(_dragStartWinPos[1] + dy, va.maxY - curH)));

  tickerWindow.setPosition(newX, newY);
});

// ─── Ticker expand / collapse ──────────────────────────────────────────────────

function resizeTickerKeepTop(newW, newH) {
  if (!tickerWindow) return;
  const [x, y] = tickerWindow.getPosition();
  const [w]    = tickerWindow.getSize();
  const va = getVirtualWorkArea();
  // Giữ cố định cạnh trên, căn giữa theo trục x, clamp không vượt work area
  const newX = Math.max(va.minX, Math.min(x + Math.round((w - newW) / 2), va.maxX - newW));
  const newY = Math.min(y, va.maxY - newH);
  tickerWindow.setBounds({ x: newX, y: newY, width: newW, height: newH });
}

ipcMain.on('ticker-expand',   () => resizeTickerKeepTop(TICKER_EXPANDED_W,  TICKER_EXPANDED_H));
ipcMain.on('ticker-collapse', () => resizeTickerKeepTop(TICKER_COLLAPSED_W, TICKER_COLLAPSED_H));

ipcMain.on('popup-resize', (_, { x, y, width, height }) => {
  if (!popupWindow) return;
  const MIN_W = 500, MIN_H = 350;
  popupWindow.setBounds({
    x:      Math.round(x),
    y:      Math.round(y),
    width:  Math.round(Math.max(MIN_W, width)),
    height: Math.round(Math.max(MIN_H, height)),
  });
});

ipcMain.on('ticker-drag-end', () => {
  _dragStartMouse  = null;
  _dragStartWinPos = null;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVirtualWorkArea() {
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  displays.forEach(({ workArea: { x, y, width, height } }) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + width  > maxX) maxX = x + width;
    if (y + height > maxY) maxY = y + height;
  });
  return { minX, minY, maxX, maxY };
}

// ─── Tray ─────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('BTC Ticker');
  tray.setTitle('₿ Loading...');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => { app.exit(0); } },
  ]);

  tray.on('click', () => {
    togglePopup();
  });

  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu);
  });
}

// ─── Ticker Widget Window ─────────────────────────────────────────────────────

function createTickerWindow() {
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  const x = sw - TICKER_COLLAPSED_W - TICKER_MARGIN; // góc phải
  const y = 200;                                      // cách trên 200px

  tickerWindow = new BrowserWindow({
    width:  TICKER_COLLAPSED_W,
    height: TICKER_COLLAPSED_H,
    x,
    y,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    alwaysOnTop: true,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nodeIntegration: false,
    },
  });

  tickerWindow.loadFile(path.join(__dirname, 'ticker', 'index.html'));

  tickerWindow.on('closed', () => {
    tickerWindow = null;
  });
}

// ─── Popup Window ─────────────────────────────────────────────────────────────

function createPopupWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  popupWindow = new BrowserWindow({
    width:  Math.round(width  - POPUP_MARGIN * 2),
    height: Math.round(height - POPUP_MARGIN * 2),
    frame: false,
    transparent: true,
    skipTaskbar: true,
    show: false,
    resizable: false,
    alwaysOnTop: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nodeIntegration: false,
    },
  });

  popupWindow.loadFile(path.join(__dirname, 'popup', 'index.html'));

  // Ẩn popup khi mất focus
  popupWindow.on('blur', () => {
    popupWindow.hide();
  });

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

function togglePopup() {
  if (!popupWindow) return;

  if (popupWindow.isVisible()) {
    popupWindow.hide();
  } else {
    positionPopup();
    popupWindow.show();
    popupWindow.focus();
  }
}

function positionPopup() {
  // Dùng màn hình đang chứa ticker (hoặc primary nếu ticker chưa tạo)
  const ref = tickerWindow ? tickerWindow.getBounds() : null;
  const display = ref
    ? screen.getDisplayNearestPoint({ x: ref.x + ref.width / 2, y: ref.y + ref.height / 2 })
    : screen.getPrimaryDisplay();

  const { x: wa_x, y: wa_y, width: wa_w, height: wa_h } = display.workArea;
  popupWindow.setBounds({
    x:      Math.round(wa_x + POPUP_MARGIN),
    y:      Math.round(wa_y + POPUP_MARGIN),
    width:  Math.round(wa_w - POPUP_MARGIN * 2),
    height: Math.round(wa_h - POPUP_MARGIN * 2),
  });
}

// ─── Binance WebSocket ─────────────────────────────────────────────────────────

function connectBinanceWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const streams = Object.keys(COINS_CONFIG).map(s => `${s}@ticker`).join('/');

  try {
    ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.on('open', () => {
      console.log('[WS] Connected to Binance combined stream');
    });

    ws.on('message', (raw) => {
      try {
        const { stream, data } = JSON.parse(raw.toString());
        const symbol = stream.split('@')[0]; // 'btcusdt'
        if (!COINS_CONFIG[symbol]) return;

        const price = parseFloat(data.c);
        const changePercent = parseFloat(data.P);
        const isUp = changePercent >= 0;

        coinsMap[symbol] = {
          symbol,
          name: COINS_CONFIG[symbol].name,
          icon: COINS_CONFIG[symbol].icon,
          price: formatPrice(price),
          changePercent: changePercent.toFixed(2),
          isUp,
        };

        // BTC drives tray title + popup header
        if (symbol === 'btcusdt') {
          const btcFormatted = price.toLocaleString('en-US', { maximumFractionDigits: 0 });
          const sign  = isUp ? '+' : '';
          const label = `₿ $${btcFormatted} ${sign}${changePercent.toFixed(2)}%`;
          if (tray) tray.setTitle(label);
          if (popupWindow && !popupWindow.isDestroyed()) {
            popupWindow.webContents.send('price-update', {
              price: btcFormatted,
              changePercent: changePercent.toFixed(2),
              isUp,
              label,
            });
          }
        }

        // Gửi tất cả coins sang ticker widget
        if (tickerWindow && !tickerWindow.isDestroyed()) {
          tickerWindow.webContents.send('coins-update', Object.values(coinsMap));
        }
      } catch (err) {
        console.error('[WS] Parse error:', err.message);
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    ws.on('close', () => {
      console.log('[WS] Disconnected. Reconnecting in 5s...');
      reconnectTimer = setTimeout(connectBinanceWebSocket, 5000);
    });

  } catch (err) {
    console.error('[WS] Connection failed:', err.message);
    reconnectTimer = setTimeout(connectBinanceWebSocket, 5000);
  }
}
