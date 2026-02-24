// Load TradingView Advanced Chart Widget
const script = document.createElement('script');
script.src = 'https://s3.tradingview.com/tv.js';

script.onload = () => {
  new TradingView.widget({
    container_id: 'chart-container',
    autosize: true,
    symbol: 'BINANCE:BTCUSDT',
    interval: 'D',
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    toolbar_bg: '#131722',
    allow_symbol_change: true,
    hide_side_toolbar: false,
    save_image: false,
    studies: ['RSI@tv-basicstudies'],
    show_watchlist: true,
    watchlist: [
      'BINANCE:BTCUSDT',
      'BINANCE:ETHUSDT',
      'BINANCE:BNBUSDT',
      'BINANCE:SOLUSDT',
      'GOLD',
      'CRYPTOCAP:BTC.D',
      'NASDAQ:IBIT',
    ],
  });
};

script.onerror = () => {
  document.getElementById('chart-container').innerHTML =
    '<div style="color:#ef5350;text-align:center;padding:40px;">Failed to load TradingView chart.<br>Check your internet connection.</div>';
};

document.head.appendChild(script);
