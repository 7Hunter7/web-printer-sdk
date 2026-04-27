// Клиентская версия (без Node.js зависимостей)

// Основные классы
export { default as PrinterManager } from './core/PrinterManager.js';
export { default as BasePrinter } from './core/BasePrinter.js';
export { PrinterError, ErrorCodes } from './core/PrinterError.js';

// Только клиентские принтеры
export { default as WifiPrinter } from './printers/WifiPrinter.js';
export { default as BluetoothPrinter } from './printers/BluetoothPrinter.js';
export { default as UsbPrinter } from './printers/UsbPrinter.js';
export { default as VirtualPrinter } from './printers/VirtualPrinter.js';

// Утилиты
export { ESCPOS, createTextLine, createReceipt } from './utils/escpos.js';
export { ZPL, createLabel, createWasteLabel, serializeZPL } from './utils/zpl.js';

// Vue миксин
export { printerMixin } from './vue/printerMixin.js';

// Версия
export const VERSION = '1.0.3';

// Функция-заглушка для ImageProcessor
export class ImageProcessor {
  constructor() {
    throw new Error('ImageProcessor is only available in Node.js environment. Use web-printer-sdk/node.js instead.');
  }
}