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


## Пример использования (Vue 2)
```script
<!-- examples/vue2-example.vue -->
<template>
  <div class="printer-example">
    <h2>Настройки принтера</h2>
    
    <div class="form-group">
      <label>Тип принтера</label>
      <select v-model="printerType" @change="onPrinterTypeChange">
        <option value="wifi">WiFi принтер</option>
        <option value="bluetooth">Bluetooth принтер</option>
        <option value="usb">USB принтер</option>
        <option value="virtual">Виртуальный (тест)</option>
      </select>
    </div>

    <div v-if="printerType === 'wifi'" class="form-group">
      <label>IP адрес</label>
      <input v-model="printerConfig.ip" placeholder="192.168.1.100" />
    </div>

    <div v-if="printerType === 'bluetooth'" class="form-group">
      <label>COM порт</label>
      <input v-model="printerConfig.path" placeholder="COM3" />
    </div>

    <div class="form-group">
      <button @click="discoverPrinters" :disabled="!printerType">
        🔍 Найти принтеры
      </button>
    </div>

    <div v-if="availablePrinters.length" class="printers-list">
      <h3>Доступные принтеры:</h3>
      <div 
        v-for="printer in availablePrinters" 
        :key="printer.id"
        class="printer-item"
        @click="connectPrinter(printer)"
      >
        <strong>{{ printer.name }}</strong>
        <span>{{ printer.type }}</span>
      </div>
    </div>

    <div class="print-section">
      <h3>Тестовая печать</h3>
      <button @click="printTest" :disabled="!isPrinterConnected">
        🖨️ Печать тестового чека
      </button>
    </div>

    <div v-if="printerError" class="error">
      Ошибка: {{ printerError }}
    </div>

    <div v-if="isPrinting" class="loading">
      Печать...
    </div>
  </div>
</template>

<script>
import { printerMixin } from 'web-printer-sdk';
import { createReceipt } from 'web-printer-sdk';

export default {
  mixins: [printerMixin],
  
  data() {
    return {
      printerType: 'virtual',
      printerConfig: {
        ip: '',
        path: '',
        port: 9100
      }
    };
  },

  methods: {
    onPrinterTypeChange() {
      this.printerManager.setPrinterType(this.printerType);
    },

    async discoverPrinters() {
      const printers = await this.discoverPrinters();
      console.log('Found printers:', printers);
    },

    async connectPrinter(printer) {
      const config = {
        type: this.printerType,
        ip: printer.ip,
        path: printer.path,
        port: printer.port || 9100
      };
      await this.connectPrinter(config);
      this.$notify?.success('Принтер подключен!', 'Успешно');
    },

    async printTest() {
      const items = [
        { name: 'Товар 1', qty: 2, price: 100 },
        { name: 'Товар 2', qty: 1, price: 250 }
      ];
      const total = 450;
      
      const receipt = createReceipt(items, total);
      await this.print(receipt);
      
      this.$notify?.success('Печать выполнена!', 'Успешно');
    }
  }
};
</script>
```