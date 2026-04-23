import { PrinterError, ErrorCodes } from '../../../src/core/PrinterError.js';

describe('PrinterError', () => {
  test('should create error with code and message', () => {
    const error = new PrinterError(ErrorCodes.CONNECTION_FAILED, 'Connection failed');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PrinterError');
    expect(error.code).toBe(ErrorCodes.CONNECTION_FAILED);
    expect(error.message).toBe('Connection failed');
  });

  test('should have all error codes defined', () => {
    const expectedCodes = [
      'DISCOVERY_FAILED',
      'CONNECTION_FAILED',
      'NOT_CONNECTED',
      'PRINT_FAILED',
      'UNSUPPORTED_TYPE',
      'MISSING_CONFIG',
      'NO_PRINTER_SELECTED'
    ];
    
    expectedCodes.forEach(code => {
      expect(ErrorCodes[code]).toBeDefined();
    });
  });
});