import BasePrinter from '../core/BasePrinter.js';
import { PrinterError, ErrorCodes } from '../core/PrinterError.js';

class UsbPrinter extends BasePrinter {
  constructor(config = {}) {
    super(config);
    this.device = null;
    this.interface = null;
    this.endpoint = null;
  }

  async discover() {
    try {
      if (typeof navigator !== 'undefined' && navigator.usb) {
        return await this._discoverWebUSB();
      } else {
        return await this._discoverNodeUSB();
      }
    } catch (error) {
      throw new PrinterError(
        ErrorCodes.DISCOVERY_FAILED,
        `Discovery failed: ${error.message}`
      );
    }
  }

  async _discoverWebUSB() {
    const devices = await navigator.usb.getDevices();
    return devices.map(device => ({
      id: `${device.vendorId}:${device.productId}`,
      vendorId: device.vendorId,
      productId: device.productId,
      name: device.productName || `USB Printer (${device.vendorId}:${device.productId})`,
      type: 'usb',
      protocol: 'web-usb'
    }));
  }

  async _discoverNodeUSB() {
    const usb = await import('usb');
    const devices = usb.getDeviceList();
    const printers = [];

    for (const device of devices) {
      const desc = device.deviceDescriptor;
      if (this._isLikelyPrinter(desc)) {
        printers.push({
          id: `${desc.idVendor}:${desc.idProduct}`,
          vendorId: desc.idVendor,
          productId: desc.idProduct,
          name: `USB Printer (${desc.idVendor.toString(16)}:${desc.idProduct.toString(16)})`,
          type: 'usb',
          device: device,
          protocol: 'node-usb'
        });
      }
    }
    return printers;
  }

  _isLikelyPrinter(desc) {
    // Класс устройства 7 = printer class
    if (desc.bDeviceClass === 7) return true;
    
    // Известные VID/PID принтеров
    const knownPrinters = [
      { vid: 0x04b8, pid: 0x0e15 }, // Epson
      { vid: 0x067b, pid: 0x2305 }, // Prolific
      { vid: 0x0416, pid: 0x5011 }, // WinChipHead
      { vid: 0x1504, pid: 0x0006 }, // Bixolon
    ];
    
    return knownPrinters.some(p => p.vid === desc.idVendor && p.pid === desc.idProduct);
  }

  async connect(config) {
    return new Promise((resolve, reject) => {
      try {
        if (config.protocol === 'web-usb') {
          this._connectWebUSB(config).then(resolve).catch(reject);
        } else {
          this._connectNodeUSB(config).then(resolve).catch(reject);
        }
      } catch (error) {
        reject(new PrinterError(ErrorCodes.CONNECTION_FAILED, error.message));
      }
    });
  }

  async _connectNodeUSB(config) {
    this.device = config.device;
    this.device.open();
    
    this.interface = this.device.interface(0);
    if (this.interface.isKernelDriverActive()) {
      this.interface.detachKernelDriver();
    }
    this.interface.claim();
    
    this.endpoint = this.interface.endpoints.find(ep => ep.direction === 'out');
    
    if (!this.endpoint) {
      throw new PrinterError(ErrorCodes.CONNECTION_FAILED, 'Output endpoint not found');
    }
    
    this.isConnected = true;
    return { success: true };
  }

  async print(data) {
    if (!this.isConnected || !this.endpoint) {
      throw new PrinterError(ErrorCodes.NOT_CONNECTED, 'Printer is not connected');
    }

    return new Promise((resolve, reject) => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      this.endpoint.transfer(buffer, (error) => {
        if (error) {
          reject(new PrinterError(ErrorCodes.PRINT_FAILED, error.message));
          return;
        }
        resolve({ success: true, bytesWritten: buffer.length });
      });
    });
  }

  async disconnect() {
    if (this.interface) {
      this.interface.release(true);
    }
    if (this.device) {
      this.device.close();
    }
    this.isConnected = false;
    this.device = null;
    this.interface = null;
    this.endpoint = null;
  }
}

export default UsbPrinter;