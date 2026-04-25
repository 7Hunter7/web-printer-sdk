import WifiPrinter from "../printers/WifiPrinter.js";
import BluetoothPrinter from "../printers/BluetoothPrinter.js";
import UsbPrinter from "../printers/UsbPrinter.js";
import VirtualPrinter from "../printers/VirtualPrinter.js";
import { PrinterError, ErrorCodes } from "./PrinterError.js";

class PrinterManager {
  constructor() {
    this.printers = {
      wifi: WifiPrinter,
      bluetooth: BluetoothPrinter,
      usb: UsbPrinter,
      virtual: VirtualPrinter,
    };
    this.activePrinter = null;
    this.printerType = null;
  }

  /**
   * Выбор типа принтера
   * @param {string} type - 'wifi', 'bluetooth', 'usb'
   * @param {Object} config
   */
  setPrinterType(type, config = {}) {
    if (!this.printers[type]) {
      throw new PrinterError(
        ErrorCodes.UNSUPPORTED_TYPE,
        `Unsupported printer type: ${type}`,
      );
    }

    this.printerType = type;
    this.activePrinter = new this.printers[type](config);
    return this.activePrinter;
  }

  /**
   * Поиск доступных принтеров
   */
  async discover() {
    if (!this.activePrinter) {
      throw new PrinterError(
        ErrorCodes.NO_PRINTER_SELECTED,
        "No printer type selected",
      );
    }
    return await this.activePrinter.discover();
  }

  /**
   * Подключение к принтеру
   */
  async connect(config) {
    if (!this.activePrinter) {
      throw new PrinterError(
        ErrorCodes.NO_PRINTER_SELECTED,
        "No printer type selected",
      );
    }
    return await this.activePrinter.connect(config);
  }

  /**
   * Печать
   */
  async print(data) {
    if (!this.activePrinter) {
      throw new PrinterError(
        ErrorCodes.NO_PRINTER_SELECTED,
        "No printer type selected",
      );
    }
    if (!this.activePrinter.getConnected()) {
      throw new PrinterError(
        ErrorCodes.NOT_CONNECTED,
        "Printer is not connected",
      );
    }
    return await this.activePrinter.print(data);
  }

  /**
   * Отключение
   */
  async disconnect() {
    if (this.activePrinter && this.activePrinter.getConnected()) {
      await this.activePrinter.disconnect();
    }
  }

  /**
   * Статус подключения
   */
  isConnected() {
    return this.activePrinter ? this.activePrinter.getConnected() : false;
  }

  /**
   * Получить активный принтер
   */
  getPrinter() {
    return this.activePrinter;
  }
}

export default PrinterManager;
