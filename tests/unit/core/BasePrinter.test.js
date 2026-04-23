import BasePrinter from '../../../src/core/BasePrinter.js';

describe('BasePrinter (abstract class)', () => {
  test('should throw error when instantiating directly', () => {
    expect(() => new BasePrinter()).toThrow('BasePrinter is abstract class');
  });

  test('should throw error when calling abstract methods', () => {
    class TestPrinter extends BasePrinter {}
    const printer = new TestPrinter();
    
    expect(printer.discover()).rejects.toThrow('Method discover() must be implemented');
    expect(printer.connect()).rejects.toThrow('Method connect() must be implemented');
    expect(printer.print()).rejects.toThrow('Method print() must be implemented');
    expect(printer.disconnect()).rejects.toThrow('Method disconnect() must be implemented');
  });

  test('should return connection status', () => {
    class TestPrinter extends BasePrinter {}
    const printer = new TestPrinter();
    
    expect(printer.getConnected()).toBe(false);
    printer.isConnected = true;
    expect(printer.getConnected()).toBe(true);
  });
});