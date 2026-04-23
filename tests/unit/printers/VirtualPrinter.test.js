import VirtualPrinter from '../../../src/printers/VirtualPrinter.js';

describe('VirtualPrinter', () => {
  let printer;

  beforeEach(() => {
    printer = new VirtualPrinter();
  });

  test('should discover virtual printer', async () => {
    const printers = await printer.discover();
    
    expect(printers).toHaveLength(1);
    expect(printers[0]).toMatchObject({
      id: 'virtual-1',
      name: 'Virtual Printer (Test)',
      type: 'virtual'
    });
  });

  test('should connect to virtual printer', async () => {
    const result = await printer.connect({});
    
    expect(result.success).toBe(true);
    expect(printer.isConnected).toBe(true);
  });

  test('should print data', async () => {
    await printer.connect({});
    const result = await printer.print('Test print data');
    
    expect(result.success).toBe(true);
    expect(result.bytesWritten).toBeGreaterThan(0);
  });

  test('should throw error when printing without connection', async () => {
    await expect(printer.print('Test')).rejects.toThrow('Virtual printer is not connected');
  });

  test('should store print history', async () => {
    await printer.connect({});
    await printer.print('First print');
    await printer.print('Second print');
    
    expect(printer.getHistory()).toHaveLength(2);
    expect(printer.getLastJob().data).toBe('Second print');
  });

  test('should clear history', async () => {
    await printer.connect({});
    await printer.print('Test');
    
    printer.clearHistory();
    expect(printer.getHistory()).toHaveLength(0);
  });

  test('should disconnect', async () => {
    await printer.connect({});
    await printer.disconnect();
    
    expect(printer.isConnected).toBe(false);
  });
});