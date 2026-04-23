# 🖨️ Web Printer SDK

[![npm version](https://img.shields.io/npm/v/web-printer-sdk.svg)](https://www.npmjs.com/package/web-printer-sdk)
[![npm downloads](https://img.shields.io/npm/dm/web-printer-sdk.svg)](https://www.npmjs.com/package/web-printer-sdk)
[![license](https://img.shields.io/npm/l/web-printer-sdk.svg)](https://github.com/7Hunter7/web-printer-sdk/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vue 2 & 3](https://img.shields.io/badge/Vue-2.x%20%7C%203.x-brightgreen)](https://vuejs.org/)
[![Tests](https://img.shields.io/badge/tests-85%20passed-brightgreen)](https://github.com/7Hunter7/web-printer-sdk)

> Профессиональный SDK для подключения принтеров к веб-приложениям.  
> Поддерживает WiFi, Bluetooth, USB и термические принтеры с ESC/POS и ZPL командами.

## ✨ Особенности

- 🚀 **Zero dependencies** - минимальный размер, никакого лишнего кода
- 📱 **Кроссплатформенность** - Windows, Linux, Mac
- 🌐 **Поддержка браузеров** - Chrome, Firefox, Edge, Safari
- 🎯 **Все типы принтеров** - WiFi, Bluetooth, USB, Thermal
- 📦 **ESC/POS и ZPL** - готовые команды для печати
- 🖼️ **Обработка изображений** - конвертация для термопринтеров
- 🎨 **Vue.js интеграция** - миксины для Vue 2 и 3
- 📝 **TypeScript** - полная типизация
- 🧪 **85+ тестов** - высокое покрытие кода

## 📦 Установка

```bash
npm install web-printer-sdk
# или
yarn add web-printer-sdk
```

## 🚀 Быстрый старт

### Базовое использование

```javascript
import { PrinterManager, createReceipt } from 'web-printer-sdk';

// 1. Создаем менеджер
const manager = new PrinterManager();

// 2. Выбираем тип принтера
manager.setPrinterType('virtual'); // или 'wifi', 'bluetooth', 'usb'

// 3. Подключаемся
await manager.connect({ type: 'virtual' });

// 4. Готовим данные для печати
const items = [
  { name: 'Товар 1', qty: 2, price: 100 },
  { name: 'Товар 2', qty: 1, price: 250 }
];
const receipt = createReceipt(items, 450);

// 5. Печатаем
await manager.print(receipt);

// 6. Отключаемся
await manager.disconnect();
```

### Для Vue.js проектов

```vue
<template>
  <div class="printer-settings">
    <select v-model="printerType" @change="onPrinterTypeChange">
      <option value="wifi">WiFi принтер</option>
      <option value="bluetooth">Bluetooth принтер</option>
      <option value="usb">USB принтер</option>
      <option value="virtual">Виртуальный (тест)</option>
    </select>

    <div v-if="printerType === 'wifi'">
      <input v-model="printerConfig.ip" placeholder="IP адрес" />
    </div>

    <button @click="searchPrinters" :disabled="!printerType">
      🔍 Найти принтеры
    </button>

    <button @click="printTest" :disabled="!isPrinterConnected">
      🖨️ Печать
    </button>

    <div v-if="printerError" class="error">{{ printerError }}</div>
  </div>
</template>

<script>
import { printerMixin } from 'web-printer-sdk';

export default {
  mixins: [printerMixin],
  data() {
    return {
      printerType: 'virtual',
      printerConfig: { ip: '', port: 9100 }
    };
  },
  methods: {
    onPrinterTypeChange() {
      this.printerManager.setPrinterType(this.printerType);
    },
    async searchPrinters() {
      const printers = await this.discoverPrinters();
      console.log('Найдены принтеры:', printers);
    },
    async printTest() {
      const receipt = this.createTestReceipt();
      await this.print(receipt);
    }
  }
};
</script>
```

## 📚 API Reference

### Классы

| Класс | Описание |
|-------|----------|
| `PrinterManager` | Главный менеджер для управления принтерами |
| `BasePrinter` | Абстрактный базовый класс для всех принтеров |
| `WifiPrinter` | WiFi принтеры (TCP/IP) |
| `BluetoothPrinter` | Bluetooth принтеры (Serial) |
| `UsbPrinter` | USB принтеры |
| `ThermalPrinter` | Термические принтеры с ESC/POS |
| `VirtualPrinter` | Виртуальный принтер для тестирования |

### Методы PrinterManager

| Метод | Описание |
|-------|----------|
| `setPrinterType(type, config)` | Выбор типа принтера |
| `discover()` | Поиск доступных принтеров |
| `connect(config)` | Подключение к принтеру |
| `print(data)` | Отправка данных на печать |
| `disconnect()` | Отключение от принтера |
| `isConnected()` | Проверка статуса подключения |

### Утилиты для печати

| Функция | Описание |
|---------|----------|
| `createTextLine(text, alignment)` | Создание строки текста |
| `createReceipt(items, total)` | Создание чека из данных |
| `createLabel(data, options)` | Создание ZPL этикетки |
| `createWasteLabel(wasteData)` | Создание этикетки для отходов |

## 🖨️ Типы принтеров

### WiFi принтер
```javascript
manager.setPrinterType('wifi');
await manager.connect({ ip: '192.168.1.100', port: 9100 });
```

### Bluetooth принтер
```javascript
manager.setPrinterType('bluetooth');
await manager.connect({ path: 'COM3', baudRate: 9600 });
```

### USB принтер
```javascript
manager.setPrinterType('usb');
await manager.connect({ vendorId: 0x04b8, productId: 0x0e15 });
```

### Виртуальный принтер (для тестов)
```javascript
manager.setPrinterType('virtual');
await manager.connect({});
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск с покрытием
npm run test:coverage

# Запуск только unit тестов
npm run test:unit

# Запуск интеграционных тестов
npm run test:integration
```

### Результаты тестирования

| Метрика | Значение |
|---------|----------|
| **Всего тестов** | 85 |
| **Пройдено** | 85 ✅ |
| **Покрытие кода** | ~92% |
| **Core модули** | 100% |
| **Принтеры** | ~90% |
| **Утилиты** | ~95% |

## 📋 Требования

- **Node.js**: >= 12.0.0
- **Браузеры**: Chrome, Firefox, Edge, Safari (последние версии)
- **Vue**: 2.6+ или 3.0+ (опционально)

## 🎯 Структура пакета

```
web-printer-sdk/
├── src/
│   ├── core/           # Базовые классы (PrinterManager, BasePrinter, PrinterError)
│   ├── printers/       # Реализации принтеров (WiFi, Bluetooth, USB, Thermal, Virtual)
│   ├── adapters/       # Адаптеры для браузера и Node.js
│   ├── utils/          # Утилиты (ESC/POS, ZPL, imageProcessor)
│   └── vue/            # Vue миксины для интеграции
├── tests/              # Unit и интеграционные тесты
├── index.d.ts          # TypeScript определения
└── README.md           # Документация
```

## 📄 Лицензия

MIT © [Ivan Kalugin](https://github.com/7Hunter7)

---

<p align="center">
  Сделано с ❤️ для удобной печати в веб-приложениях
</p>
```
