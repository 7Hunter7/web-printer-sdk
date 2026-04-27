// Серверная версия

// Основные классы
export { default as PrinterManager } from './core/PrinterManager.js';
export { default as BasePrinter } from './core/BasePrinter.js';
export { PrinterError, ErrorCodes } from './core/PrinterError.js';

// Все принтеры
export { default as WifiPrinter } from './printers/WifiPrinter.js';
export { default as BluetoothPrinter } from './printers/BluetoothPrinter.js';
export { default as UsbPrinter } from './printers/UsbPrinter.js';
export { default as ThermalPrinter } from './printers/ThermalPrinter.js';
export { default as VirtualPrinter } from './printers/VirtualPrinter.js';

// Все утилиты
export { ESCPOS, createTextLine, createReceipt } from './utils/escpos.js';
export { ZPL, createLabel, createWasteLabel, serializeZPL } from './utils/zpl.js';
export { default as ImageProcessor } from './utils/imageProcessor.js';

// Vue миксин
export { printerMixin } from './vue/printerMixin.js';

// Версия
export const VERSION = '1.0.3';