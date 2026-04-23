// Кастомные ошибки
export const ErrorCodes = {
  DISCOVERY_FAILED: 'DISCOVERY_FAILED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  NOT_CONNECTED: 'NOT_CONNECTED',
  PRINT_FAILED: 'PRINT_FAILED',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  MISSING_CONFIG: 'MISSING_CONFIG',
  NO_PRINTER_SELECTED: 'NO_PRINTER_SELECTED'
};

export class PrinterError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PrinterError';
    this.code = code;
  }
}