import ThermalPrinter from '../../../src/printers/ThermalPrinter.js';
import VirtualPrinter from '../../../src/printers/VirtualPrinter.js';
import { ESCPOS } from '../../../src/utils/escpos.js';

// Мокаем VirtualPrinter для тестирования ThermalPrinter
jest.mock('../../../src/printers/VirtualPrinter.js');

describe('ThermalPrinter', () => {
  let printer;
  let mockPrinter;

  beforeEach(() => {
    mockPrinter = {
      connect: jest.fn().mockResolvedValue({ success: true }),
      print: jest.fn().mockResolvedValue({ success: true, bytesWritten: 100 }),
      disconnect: jest.fn().mockResolvedValue(),
      getConnected: jest.fn().mockReturnValue(true)
    };
    
    VirtualPrinter.mockImplementation(() => mockPrinter);
    printer = new ThermalPrinter();
  });

  test('should initialize with virtual backend', async () => {
    await printer.connect({ type: 'virtual' });
    expect(printer.printer).toBeDefined();
  });

  test('should generate init command', () => {
    const init = printer.init();
    expect(init).toBeInstanceOf(Buffer);
    expect(init).toEqual(Buffer.from(ESCPOS.init));
  });

  test('should generate alignment commands', () => {
    expect(printer.align('center')).toEqual(Buffer.from([0x1B, 0x61, 0x01]));
    expect(printer.align('left')).toEqual(Buffer.from([0x1B, 0x61, 0x00]));
    expect(printer.align('right')).toEqual(Buffer.from([0x1B, 0x61, 0x02]));
  });

  test('should generate bold commands', () => {
    expect(printer.bold(true)).toEqual(Buffer.from([0x1B, 0x45, 0x01]));
    expect(printer.bold(false)).toEqual(Buffer.from([0x1B, 0x45, 0x00]));
  });

  test('should generate text with formatting', () => {
    const textBuffer = printer.text('Hello World', { align: 'center', bold: true });
    expect(textBuffer).toBeInstanceOf(Buffer);
    expect(textBuffer.length).toBeGreaterThan(0);
  });

  test('should generate separator line', () => {
    const separator = printer.separator('-', 20);
    expect(separator).toBeInstanceOf(Buffer);
  });

  test('should generate receipt', () => {
    const items = [
      { name: 'Item 1', qty: 2, price: 100 },
      { name: 'Item 2', qty: 1, price: 250 }
    ];
    const receipt = printer.printReceipt(items, 450);
    
    expect(receipt).toBeInstanceOf(Buffer);
    expect(receipt.length).toBeGreaterThan(0);
  });

  test('should print data through backend', async () => {
    await printer.connect({ type: 'virtual' });
    const result = await printer.print('Test print');
    
    expect(mockPrinter.print).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});