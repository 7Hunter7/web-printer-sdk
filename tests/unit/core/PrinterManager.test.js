import PrinterManager from '../../../src/core/PrinterManager.js';
import WifiPrinter from '../../../src/printers/WifiPrinter.js';
import VirtualPrinter from '../../../src/printers/VirtualPrinter.js';
import { PrinterError } from '../../../src/core/PrinterError.js';

describe('PrinterManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PrinterManager();
  });

  test('should set printer type correctly', () => {
    manager.setPrinterType('wifi');
    expect(manager.printerType).toBe('wifi');
    expect(manager.activePrinter).toBeInstanceOf(WifiPrinter);
  });

  test('should throw error for unsupported printer type', () => {
    expect(() => manager.setPrinterType('unsupported')).toThrow(PrinterError);
    expect(() => manager.setPrinterType('unsupported')).toThrow('Unsupported printer type');
  });

  test('should throw error when calling discover without printer selected', async () => {
    await expect(manager.discover()).rejects.toThrow(PrinterError);
    await expect(manager.discover()).rejects.toThrow('No printer type selected');
  });

  test('should throw error when calling connect without printer selected', async () => {
    await expect(manager.connect({})).rejects.toThrow(PrinterError);
  });

  test('should return connection status', () => {
    expect(manager.isConnected()).toBe(false);
    
    manager.setPrinterType('virtual');
    manager.activePrinter.isConnected = true;
    expect(manager.isConnected()).toBe(true);
  });

  test('should get active printer', () => {
    manager.setPrinterType('virtual');
    expect(manager.getPrinter()).toBeInstanceOf(VirtualPrinter);
  });

  test('should handle disconnect correctly', async () => {
    manager.setPrinterType('virtual');
    await manager.disconnect();
    expect(manager.activePrinter.isConnected).toBe(false);
  });
});