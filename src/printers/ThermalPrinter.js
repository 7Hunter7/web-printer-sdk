import BasePrinter from '../core/BasePrinter.js';
import { PrinterError, ErrorCodes } from '../core/PrinterError.js';
import { ESCPOS, createTextLine, createReceipt } from '../utils/escpos.js';
import iconv from 'iconv-lite';

class ThermalPrinter extends BasePrinter {
  constructor(config = {}) {
    super(config);
    this.printer = null; // Будет установлен через connect
    this.charSet = config.charSet || 'cp866';
    this.width = config.width || 58; // mm
  }

  async discover() {
    // Перенаправляем к соответствующему адаптеру
    if (this.printer) {
      return await this.printer.discover();
    }
    throw new PrinterError(ErrorCodes.NO_PRINTER_SELECTED, 'No printer backend selected');
  }

  async connect(config) {
    // Создаем соответствующий принтер в зависимости от типа
    const { default: WifiPrinter } = await import('./WifiPrinter.js');
    const { default: BluetoothPrinter } = await import('./BluetoothPrinter.js');
    const { default: UsbPrinter } = await import('./UsbPrinter.js');
    
    switch (config.type) {
      case 'wifi':
        this.printer = new WifiPrinter(config);
        break;
      case 'bluetooth':
        this.printer = new BluetoothPrinter(config);
        break;
      case 'usb':
        this.printer = new UsbPrinter(config);
        break;
      default:
        throw new PrinterError(ErrorCodes.UNSUPPORTED_TYPE, `Unsupported backend: ${config.type}`);
    }
    
    return await this.printer.connect(config);
  }

  /**
   * Инициализация принтера
   */
  init() {
    return Buffer.from(ESCPOS.init);
  }

  /**
   * Выравнивание текста
   */
  align(position) {
    return Buffer.from(ESCPOS.align[position] || ESCPOS.align.left);
  }

  /**
   * Жирный шрифт
   */
  bold(enable = true) {
    return Buffer.from(enable ? ESCPOS.font.bold : ESCPOS.font.boldOff);
  }

  /**
   * Размер шрифта
   */
  fontSize(size) {
    switch (size) {
      case 'double':
        return Buffer.from(ESCPOS.font.doubleSize);
      case 'double-height':
        return Buffer.from(ESCPOS.font.doubleHeight);
      case 'double-width':
        return Buffer.from(ESCPOS.font.doubleWidth);
      default:
        return Buffer.from(ESCPOS.font.normal);
    }
  }

  /**
   * Печать текста
   */
  text(str, options = {}) {
    const commands = [];
    
    if (options.align) {
      commands.push(this.align(options.align));
    }
    if (options.bold) {
      commands.push(this.bold(true));
    }
    if (options.fontSize) {
      commands.push(this.fontSize(options.fontSize));
    }
    
    commands.push(iconv.encode(str, this.charSet));
    commands.push(Buffer.from([0x0A]));
    
    if (options.bold) {
      commands.push(this.bold(false));
    }
    if (options.fontSize && options.fontSize !== 'normal') {
      commands.push(this.fontSize('normal'));
    }
    
    return Buffer.concat(commands);
  }

  /**
   * Печать строки с форматированием
   */
  line(str, options = {}) {
    return this.text(str + '\n', options);
  }

  /**
   * Печать разделителя
   */
  separator(char = '-', length = 32) {
    return this.text(char.repeat(length));
  }

  /**
   * Печать чека
   */
  printReceipt(items, total, options = {}) {
    const commands = [this.init()];
    
    // Заголовок
    if (options.header) {
      commands.push(this.line(options.header, { align: 'center', bold: true, fontSize: 'double' }));
      commands.push(this.line(''));
    }
    
    // Товары
    items.forEach(item => {
      const line = `${item.name} x${item.qty} = ${item.price * item.qty} руб.`;
      commands.push(this.line(line));
    });
    
    commands.push(this.separator('='));
    commands.push(this.line(`ИТОГО: ${total} руб.`, { align: 'right', bold: true }));
    commands.push(this.line(''));
    
    // Подвал
    if (options.footer) {
      commands.push(this.line(options.footer, { align: 'center' }));
    }
    
    commands.push(this.line('Спасибо за покупку!', { align: 'center' }));
    commands.push(this.line(''));
    commands.push(Buffer.from(ESCPOS.cut));
    
    return Buffer.concat(commands);
  }

  /**
   * Печать штрихкода
   */
  barcode(data, options = {}) {
    const commands = [];
    
    if (options.text) {
      commands.push(this.line(data));
    }
    
    commands.push(Buffer.from(ESCPOS.barcode.code128(data)));
    commands.push(Buffer.from([0x0A, 0x0A]));
    
    return Buffer.concat(commands);
  }

  async print(data) {
    if (!this.printer || !this.printer.getConnected()) {
      throw new PrinterError(ErrorCodes.NOT_CONNECTED, 'Printer is not connected');
    }
    
    let buffer;
    if (typeof data === 'string') {
      buffer = this.text(data);
    } else if (Array.isArray(data)) {
      buffer = Buffer.concat(data.map(item => 
        typeof item === 'string' ? this.text(item) : item
      ));
    } else {
      buffer = data;
    }
    
    return await this.printer.print(buffer);
  }

  async disconnect() {
    if (this.printer) {
      await this.printer.disconnect();
    }
    this.printer = null;
  }

  getConnected() {
    return this.printer ? this.printer.getConnected() : false;
  }
}

export default ThermalPrinter;