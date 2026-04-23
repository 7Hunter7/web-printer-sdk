import BasePrinter from '../core/BasePrinter.js';
import { PrinterError, ErrorCodes } from '../core/PrinterError.js';

class BluetoothPrinter extends BasePrinter {
  constructor(config = {}) {
    super(config);
    this.port = null;
    this.baudRate = config.baudRate || 9600;
  }

  async discover() {
    try {
      // Проверяем окружение
      if (typeof navigator !== 'undefined' && navigator.bluetooth) {
        return await this._discoverWebBluetooth();
      } else {
        return await this._discoverNodeSerial();
      }
    } catch (error) {
      throw new PrinterError(
        ErrorCodes.DISCOVERY_FAILED,
        `Discovery failed: ${error.message}`
      );
    }
  }

  async _discoverWebBluetooth() {
    // Web Bluetooth API (браузер)
    const devices = await navigator.bluetooth.getDevices();
    return devices
      .filter(device => device.gatt?.connected)
      .map(device => ({
        id: device.id,
        name: device.name || 'Unknown Bluetooth Printer',
        type: 'bluetooth',
        address: device.id,
        protocol: 'web-bluetooth'
      }));
  }

  async _discoverNodeSerial() {
    // Node.js serialport
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    return ports
      .filter(port => 
        port.manufacturer?.includes('Bluetooth') ||
        port.pnpId?.includes('BLUETOOTH')
      )
      .map(port => ({
        id: port.path,
        path: port.path,
        name: `Bluetooth Printer (${port.path})`,
        type: 'bluetooth',
        manufacturer: port.manufacturer,
        protocol: 'node-serial'
      }));
  }

  async connect(config) {
    return new Promise((resolve, reject) => {
      try {
        const path = config.path || config.address;
        
        if (!path) {
          reject(new PrinterError(
            ErrorCodes.MISSING_CONFIG,
            'Printer path or address is required'
          ));
          return;
        }

        this.port = new SerialPort({
          path,
          baudRate: this.baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
        });

        this.port.on('open', () => {
          this.isConnected = true;
          this.config = { ...this.config, ...config };
          resolve({ success: true, message: `Connected to ${path}` });
        });

        this.port.on('error', (err) => {
          reject(new PrinterError(ErrorCodes.CONNECTION_FAILED, err.message));
        });

      } catch (error) {
        reject(new PrinterError(ErrorCodes.CONNECTION_FAILED, error.message));
      }
    });
  }

  async print(data) {
    if (!this.isConnected || !this.port) {
      throw new PrinterError(ErrorCodes.NOT_CONNECTED, 'Printer is not connected');
    }

    return new Promise((resolve, reject) => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      this.port.write(buffer, (err) => {
        if (err) {
          reject(new PrinterError(ErrorCodes.PRINT_FAILED, err.message));
          return;
        }
        
        this.port.drain(() => {
          resolve({ success: true, bytesWritten: buffer.length });
        });
      });
    });
  }

  async disconnect() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.isConnected = false;
    this.port = null;
  }
}

export default BluetoothPrinter;