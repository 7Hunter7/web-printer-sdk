# npm-пакет для подключения принтеров к веб-приложению

## Архитектура
```bash
web-printer-sdk/
├── src/
│   ├── core/
│   │   ├── PrinterManager.js      # Главный менеджер
│   │   ├── BasePrinter.js         # Абстрактный класс
│   │   └── PrinterError.js        # Кастомные ошибки
│   ├── printers/
│   │   ├── WifiPrinter.js
│   │   ├── BluetoothPrinter.js
│   │   ├── UsbPrinter.js
│   │   └── ThermalPrinter.js      # ESC/POS команды
│   ├── adapters/
│   │   ├── BrowserAdapter.js      # WebUSB, WebBluetooth
│   │   └── NodeAdapter.js         # serialport, usb, net
│   ├── utils/
│   │   ├── escpos.js              # ESC/POS команды
│   │   ├── zpl.js                 # ZPL команды
│   │   └── imageProcessor.js
│   └── index.js
├── dist/
├── README.md
├── package.json
└── LICENSE
```

## Функциональность

### Кроссплатформенность:
- работа на Windows,
- Linux,
- Mac

### Поддержка браузеров:
 - Chrome,
 - Firefox,
 - Edge,
 - Safari

### Тестирование компонентов
