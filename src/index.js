// Основные классы
export { default as PrinterManager } from './core/PrinterManager.js';
export { default as BasePrinter } from './core/BasePrinter.js';
export { PrinterError, ErrorCodes } from './core/PrinterError.js';
// Принтеры
export { default as WifiPrinter } from './printers/WifiPrinter.js';
export { default as BluetoothPrinter } from './printers/BluetoothPrinter.js';
export { default as UsbPrinter } from './printers/UsbPrinter.js';
export { default as ThermalPrinter } from './printers/ThermalPrinter.js';
export { default as VirtualPrinter } from './printers/VirtualPrinter.js';
// Утилиты для ESC/POS
export { ESCPOS, createTextLine, createReceipt } from './utils/escpos.js';
// ZPL утилиты
export { ZPL, createLabel, createWasteLabel, serializeZPL } from './utils/zpl.js';
// ImageProcessor
export { default as ImageProcessor } from './utils/imageProcessor.js';
// Адаптеры
export { default as BrowserAdapter } from './adapters/BrowserAdapter.js';
export { default as NodeAdapter } from './adapters/NodeAdapter.js';
// Vue миксин
export { printerMixin } from './vue/printerMixin.js';

// Версия
export const VERSION = '1.0.2';

// Простой API
export async function createPrinter(type, config) {
  const manager = new PrinterManager();
  manager.setPrinterType(type, config);
  return manager;
}