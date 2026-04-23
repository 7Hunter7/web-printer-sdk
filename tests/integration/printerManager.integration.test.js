import PrinterManager from '../../src/core/PrinterManager.js';
import VirtualPrinter from '../../src/printers/VirtualPrinter.js';
import { createReceipt } from '../../src/utils/escpos.js';

describe('PrinterManager Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new PrinterManager();
  });

  test('should complete full print workflow', async () => {
    // 1. Set printer type
    manager.setPrinterType('virtual');
    expect(manager.isConnected()).toBe(false);
    
    // 2. Discover printers
    const printers = await manager.discover();
    expect(printers.length).toBeGreaterThan(0);
    
    // 3. Connect to printer
    const connectResult = await manager.connect(printers[0]);
    expect(connectResult.success).toBe(true);
    expect(manager.isConnected()).toBe(true);
    
    // 4. Create print data
    const items = [
      { name: 'Item 1', qty: 2, price: 100 },
      { name: 'Item 2', qty: 1, price: 250 }
    ];
    const receipt = createReceipt(items, 450);
    
    // 5. Print
    const printResult = await manager.print(receipt);
    expect(printResult.success).toBe(true);
    
    // 6. Disconnect
    await manager.disconnect();
    expect(manager.isConnected()).toBe(false);
  });

  test('should handle connection failure gracefully', async () => {
    manager.setPrinterType('virtual');
    
    // Мокаем ошибку подключения
    const mockError = new Error('Connection refused');
    jest.spyOn(manager.activePrinter, 'connect').mockRejectedValue(mockError);
    
    await expect(manager.connect({})).rejects.toThrow('Connection refused');
    expect(manager.isConnected()).toBe(false);
  });

  test('should throw error when printing without connection', async () => {
    manager.setPrinterType('virtual');
    
    await expect(manager.print('test')).rejects.toThrow('Printer is not connected');
  });
});