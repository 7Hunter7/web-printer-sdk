import { ZPL, createLabel, createWasteLabel } from '../../../src/utils/zpl.js';

describe('ZPL Utils', () => {
  test('ZPL constants should be defined', () => {
    expect(ZPL.start).toBe('^XA');
    expect(ZPL.end).toBe('^XZ');
  });

  test('should create barcode command', () => {
    const barcode = ZPL.barcode.code128('1234567890', { x: 50, y: 50 });
    expect(barcode).toContain('^FO50,50');
    expect(barcode).toContain('^BCN');
    expect(barcode).toContain('1234567890');
  });

  test('should create QR code command', () => {
    const qr = ZPL.barcode.qrcode('Test Data', { x: 50, y: 50 });
    expect(qr).toContain('^FO50,50');
    expect(qr).toContain('^BQN');
    expect(qr).toContain('Test Data');
  });

  test('should create text command', () => {
    const text = ZPL.text('Hello World', { x: 50, y: 50, font: '1' });
    expect(text).toContain('^FO50,50');
    expect(text).toContain('^A1');
    expect(text).toContain('Hello World');
  });

  test('should create full label', () => {
    const label = createLabel({
      header: 'Test Label',
      barcode: '123456',
      fields: [
        { label: 'Name:', value: 'John Doe' }
      ]
    });
    
    expect(label).toBeInstanceOf(Buffer);
    expect(label.toString()).toContain('^XA');
    expect(label.toString()).toContain('^XZ');
  });

  test('should create waste label', () => {
    const wasteData = {
      id: 'W001',
      type: 'Plastic',
      weight: 5.5,
      address: 'Test St 123'
    };
    
    const label = createWasteLabel(wasteData);
    expect(label).toBeInstanceOf(Buffer);
    expect(label.toString()).toContain('WASTE STICKER');
  });
});