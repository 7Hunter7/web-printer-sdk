import { ESCPOS, createTextLine, createReceipt } from '../../../src/utils/escpos.js';

describe('ESC/POS Utils', () => {
  test('ESCPOS constants should be defined', () => {
    expect(ESCPOS.init).toBeDefined();
    expect(ESCPOS.align).toBeDefined();
    expect(ESCPOS.font).toBeDefined();
    expect(ESCPOS.cut).toBeDefined();
  });

  test('should create text line', () => {
    const textLine = createTextLine('Hello World', 'center');
    expect(textLine).toBeInstanceOf(Buffer);
    expect(textLine.length).toBeGreaterThan(0);
  });

  test('should create receipt from data', () => {
    const items = [
      { name: 'Product 1', qty: 2, price: 100 },
      { name: 'Product 2', qty: 1, price: 200 }
    ];
    const receipt = createReceipt(items, 400);
    
    expect(receipt).toBeInstanceOf(Buffer);
    expect(receipt.length).toBeGreaterThan(0);
    expect(receipt.toString()).toContain('ИТОГО');
  });
});