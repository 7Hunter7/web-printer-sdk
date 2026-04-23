// Основные классы
export { default as PrinterManager } from './core/PrinterManager.js';
export { default as BasePrinter } from './core/BasePrinter.js';
export { PrinterError, ErrorCodes } from './core/PrinterError.js';

// Принтеры
export { default as WifiPrinter } from './printers/WifiPrinter.js';
export { default as BluetoothPrinter } from './printers/BluetoothPrinter.js';
export { default as UsbPrinter } from './printers/UsbPrinter.js';

// Утилиты для ESC/POS
export { ESCPOS, createTextLine, createReceipt } from './utils/escpos.js';

// Версия
export const VERSION = '1.0.0';

// Простой API
export async function createPrinter(type, config) {
  const manager = new PrinterManager();
  manager.setPrinterType(type, config);
  return manager;
}