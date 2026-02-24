# BTC Ticker

Ứng dụng Electron chạy trên **Ubuntu**, hiển thị giá crypto realtime dưới dạng widget nổi trên màn hình và biểu đồ TradingView.

---

## Tính năng

### Widget nổi (Ticker)
- Hiển thị giá **BTC** realtime dạng pill nhỏ, luôn nằm trên cùng màn hình
- **Hover** vào widget → xổ xuống hiển thị thêm **ETH, BNB, SOL**
- Màu xanh / đỏ theo xu hướng giá, dot nhấp nháy live
- **Kéo thả** tự do đến bất kỳ vị trí nào, hỗ trợ **multi-monitor**
- **Click** vào widget → mở/đóng popup chart

### Popup Chart
- Biểu đồ **TradingView Advanced Chart** full-featured
- Mở ra gần full màn hình, hỗ trợ **kéo resize** theo 5 hướng (cạnh phải, cạnh dưới, 3 góc)
- Header có thể kéo để **di chuyển** cửa sổ
- Hiển thị giá BTC realtime trên header
- Click ra ngoài → tự đóng

### TradingView Chart
| Cấu hình | Giá trị |
|---|---|
| Symbol mặc định | `BINANCE:BTCUSDT` |
| Theme | Dark |
| Interval | 1D |
| Studies | RSI |
| Watchlist | BTC, ETH, BNB, SOL, GOLD, BTC.D, IBIT |

### System Tray
- Icon BTC trên thanh taskbar
- Label hiển thị giá realtime: `₿ $104,320 +1.23%`
- Click → toggle popup chart
- Right-click → menu Quit

### Giá realtime
- Kết nối **Binance WebSocket** combined stream: BTC, ETH, BNB, SOL
- Auto-reconnect sau 5 giây khi mất kết nối

---

## Cấu trúc project

```
btc-ticker/
├── package.json
├── electron-builder.yml
├── assets/
│   └── icon.png                 # icon tray 256x256
├── src/
│   ├── main.js                  # main process: tray, websocket, windows
│   ├── preload.js               # IPC bridge
│   ├── popup/
│   │   ├── index.html           # popup chart UI
│   │   ├── chart.js             # TradingView widget
│   │   └── style.css
│   └── ticker/
│       ├── index.html           # ticker widget UI
│       └── style.css
└── dist/                        # output build
```

---

## Yêu cầu

- **Node.js** >= 18
- **Ubuntu** 20.04+ (hoặc distro Linux có hỗ trợ Electron)
- Kết nối internet (Binance WebSocket + TradingView CDN)

### Ubuntu GNOME — System Tray

GNOME 22.04+ cần extension AppIndicator để hiện tray icon:

```bash
sudo apt install gnome-shell-extension-appindicator
gnome-extensions enable ubuntu-appindicators@ubuntu.com
# Đăng xuất và đăng nhập lại GNOME
```

KDE Plasma, XFCE, MATE hoạt động ngay, không cần cấu hình thêm.

---

## Cài đặt & Chạy

```bash
# Clone và cài dependencies
npm install

# Chạy dev
npm start

# Build cho Linux (.deb + .AppImage)
npm run build
```

---

## Cài đặt sau khi build

### Cách 1 — AppImage (không cần cài, chạy thẳng)

```bash
# Cấp quyền thực thi và copy vào thư mục cố định
chmod +x "dist/BTC Ticker-1.0.0.AppImage"
mkdir -p ~/Applications
cp "dist/BTC Ticker-1.0.0.AppImage" ~/Applications/

# Tạo autostart (tự khởi động cùng hệ thống)
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/btc-ticker.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=BTC Ticker
Exec=/home/$USER/Applications/BTC Ticker-1.0.0.AppImage
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

### Cách 2 — .deb (khuyến nghị, tích hợp sạch vào hệ thống)

```bash
# Cài package
sudo dpkg -i dist/btc-ticker_1.0.0_amd64.deb

# Tạo autostart
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/btc-ticker.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=BTC Ticker
Exec=btc-ticker --no-sandbox
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Gỡ cài đặt (khi cần)
sudo apt remove btc-ticker
```

### Xóa autostart

```bash
rm ~/.config/autostart/btc-ticker.desktop
```

---

## Tech Stack

| Package | Vai trò |
|---|---|
| `electron` | Framework chính |
| `electron-builder` | Build `.deb` / `.AppImage` |
| `ws` | Binance WebSocket client |
| TradingView Widget | Biểu đồ (load từ CDN) |
