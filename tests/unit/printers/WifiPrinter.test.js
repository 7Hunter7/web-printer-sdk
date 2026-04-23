import WifiPrinter from '../../../src/printers/WifiPrinter.js';
import { PrinterError } from '../../../src/core/PrinterError.js';

// Мокаем net модуль
jest.mock('net', () => {
  const mockSocket = {
    connect: jest.fn(),
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn()
  };
  
  return {
    Socket: jest.fn(() => mockSocket)
  };
});

describe('WifiPrinter', () => {
  let printer;
  let mockNet;

  beforeEach(() => {
    printer = new WifiPrinter();
    mockNet = require('net');
  });

  test('should generate common IPs', () => {
    const ips = printer._generateCommonIPs();
    expect(ips.length).toBeGreaterThan(100);
    expect(ips[0]).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });

  test('should check printer availability', async () => {
    const result = await printer._checkPrinter('127.0.0.1');
    expect(result).toBeDefined();
  });

  test('should connect to printer', async () => {
    const config = { ip: '192.168.1.100', port: 9100 };
    const connectPromise = printer.connect(config);
    
    // Simulate successful connection
    const connectCallback = mockNet.Socket.mock.calls[0][0].connect;
    if (connectCallback) {
      connectCallback();
    }
    
    await expect(connectPromise).resolves.toBeDefined();
  });

  test('should throw error on connection timeout', async () => {
    printer.timeout = 100;
    const config = { ip: '192.168.1.100', port: 9100 };
    
    // Simulate timeout
    setTimeout(() => {
      const errorCallback = mockNet.Socket.mock.calls[0][0].on.mock.calls.find(
        call => call[0] === 'error'
      );
      if (errorCallback) {
        errorCallback[1](new Error('Timeout'));
      }
    }, 50);
    
    await expect(printer.connect(config)).rejects.toThrow();
  });
});