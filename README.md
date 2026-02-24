 
 
  ---                                                                                                                                  
  Cách 1 — Dùng AppImage (không cần cài, chạy thẳng)                                                                                   
   
  # 1. Cấp quyền thực thi                                                                                                              
  chmod +x "/home/sotatek/my-projects/app-tradingview/dist/BTC Ticker-1.0.0.AppImage"

  # 2. Copy vào thư mục cố định (nên để ở đây thay vì dist/)
  mkdir -p ~/Applications
  cp "/home/sotatek/my-projects/app-tradingview/dist/BTC Ticker-1.0.0.AppImage" ~/Applications/

  # 3. Tạo autostart entry
  mkdir -p ~/.config/autostart
  cat > ~/.config/autostart/btc-ticker.desktop << 'EOF'
  [Desktop Entry]
  Type=Application
  Name=BTC Ticker
  Exec=/home/sotatek/Applications/BTC Ticker-1.0.0.AppImage
  Hidden=false
  NoDisplay=false
  X-GNOME-Autostart-enabled=true
  EOF

  ---
  Cách 2 — Dùng .deb (cài hệ thống, clean hơn)

  # 1. Cài package
  sudo dpkg -i /home/sotatek/my-projects/app-tradingview/dist/btc-ticker_1.0.0_amd64.deb

  # 2. Tạo autostart entry (lệnh sau khi cài sẽ là 'btc-ticker')
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

  ---
  Kiểm tra autostart đã hoạt động

  # Xem file vừa tạo
  cat ~/.config/autostart/btc-ticker.desktop

  # Test thử chạy ngay (không cần reboot)
  gtk-launch btc-ticker

  Gỡ autostart (nếu muốn xóa)

  rm ~/.config/autostart/btc-ticker.desktop

  ---
  Khuyến nghị dùng .deb — sau khi cài xong app sẽ tích hợp sạch vào hệ thống, có thể gỡ bằng sudo apt remove btc-ticker.