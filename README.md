# npm-пакет для подключения принтеров к веб-приложению

## Архитектура
```bash
web-printer-sdk/
├── src/
│   ├── core/
│   │   ├── BasePrinter.js              # Абстрактный класс
│   │   ├── PrinterManager.js           # Главный менеджер
│   │   └── PrinterError.js             # Кастомные ошибки
│   ├── printers/
│   │   ├── WifiPrinter.js              # WiFi принтер
│   │   ├── BluetoothPrinter.js         # Bluetooth принтер
│   │   ├── UsbPrinter.js               # USB принтер
│   │   ├── ThermalPrinter.js           # Термический принтер
│   │   └── VirtualPrinter.js           # Для тестирования
│   ├── adapters/
│   │   ├── BrowserAdapter.js           # WebUSB, WebBluetooth
│   │   ├── NodeAdapter.js              # serialport, usb, net
│   │   └── index.js
│   ├── formats/
│   │   ├── escpos.js                   # ESC/POS команды
│   │   ├── zpl.js                      # ZPL команды
│   │   ├── html.js                     # HTML в печать
│   │   └── index.js
│   ├── utils/
│   │   ├── imageProcessor.js           # Обработка изображений
│   │   ├── barcode.js                  # Генерация штрихкодов
│   │   └── helpers.js
│   ├── vue/
│   │   ├── printerMixin.js             # Vue миксин
│   │   └── PrinterSettings.vue         # Компонент настроек
│   └── index.js                        # Главный экспорт
├── tests/
│   ├── unit/
│   │   ├── WifiPrinter.test.js
│   │   ├── BluetoothPrinter.test.js
│   │   ├── UsbPrinter.test.js
│   │   └── escpos.test.js
│   └── integration/
│       └── printerManager.test.js
├── examples/
│   ├── vue2-example.vue
│   ├── vue3-example.vue
│   └── node-example.js
├── dist/
├── index.d.ts
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
