/**
 * Node.js адаптер для serialport, usb, net
 * Работает в серверной среде
 */
class NodeAdapter {
  constructor() {
    this.isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    this.modules = null;
  }

  /**
   * Ленивая загрузка модулей
   */
  async loadModules() {
    if (!this.isNode) {
      throw new Error('NodeAdapter can only be used in Node.js environment');
    }
    
    if (!this.modules) {
      this.modules = {
        serialport: await import('serialport'),
        usb: await import('usb'),
        net: await import('net')
      };
    }
    return this.modules;
  }

  /**
   * Получение списка Serial портов
   */
  async getSerialPorts() {
    const { serialport } = await this.loadModules();
    const ports = await serialport.SerialPort.list();
    
    return ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      pnpId: port.pnpId,
      locationId: port.locationId,
      productId: port.productId,
      vendorId: port.vendorId
    }));
  }

  /**
   * Создание Serial соединения
   */
  async createSerialPort(path, options = {}) {
    const { serialport } = await this.loadModules();
    
    const port = new serialport.SerialPort({
      path,
      baudRate: options.baudRate || 9600,
      dataBits: options.dataBits || 8,
      stopBits: options.stopBits || 1,
      parity: options.parity || 'none',
      autoOpen: false
    });
    
    return port;
  }

  /**
   * Открытие Serial порта
   */
  openSerialPort(port) {
    return new Promise((resolve, reject) => {
      port.open((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  }

  /**
   * Запись в Serial порт
   */
  writeSerial(port, data) {
    return new Promise((resolve, reject) => {
      port.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Закрытие Serial порта
   */
  closeSerialPort(port) {
    return new Promise((resolve) => {
      port.close(() => resolve());
    });
  }

  /**
   * Получение списка USB устройств
   */
  async getUSBDevices() {
    const { usb } = await this.loadModules();
    const devices = usb.getDeviceList();
    
    return devices.map(device => {
      const desc = device.deviceDescriptor;
      return {
        vendorId: desc.idVendor,
        productId: desc.idProduct,
        deviceClass: desc.bDeviceClass,
        deviceSubClass: desc.bDeviceSubClass,
        deviceProtocol: desc.bDeviceProtocol,
        device: device
      };
    });
  }

  /**
   * Открытие USB устройства
   */
  openUSBDevice(device) {
    device.open();
    return device;
  }

  /**
   * Открепление драйвера ядра для USB
   */
  detachUSBKernelDriver(device, interfaceNum = 0) {
    if (device.isKernelDriverActive(interfaceNum)) {
      device.detachKernelDriver(interfaceNum);
    }
  }

  /**
   * Захват интерфейса USB
   */
  claimUSBInterface(device, interfaceNum = 0) {
    device.claimInterface(interfaceNum);
    return device.interface(interfaceNum);
  }

  /**
   * Поиск endpoint для USB
   */
  findUSBEndpoint(usbInterface, direction = 'out') {
    return usbInterface.endpoints.find(ep => ep.direction === direction);
  }

  /**
   * Передача данных через USB
   */
  transferUSB(endpoint, data) {
    return new Promise((resolve, reject) => {
      endpoint.transfer(data, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Создание TCP соединения (WiFi принтер)
   */
  createTCPConnection(host, port = 9100, timeout = 5000) {
    const { net } = this.modules || require('net');
    
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      
      const timeoutId = setTimeout(() => {
        client.destroy();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);
      
      client.connect(port, host, () => {
        clearTimeout(timeoutId);
        resolve(client);
      });
      
      client.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  /**
   * Запись в TCP сокет
   */
  writeTCP(client, data) {
    return new Promise((resolve, reject) => {
      client.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Закрытие TCP соединения
   */
  closeTCP(client) {
    client.end();
  }

  /**
   * Проверка доступности TCP порта
   */
  async checkTCPPort(host, port = 9100, timeout = 1000) {
    const { net } = this.modules || require('net');
    
    return new Promise((resolve) => {
      const client = new net.Socket();
      
      const timeoutId = setTimeout(() => {
        client.destroy();
        resolve(false);
      }, timeout);
      
      client.connect(port, host, () => {
        clearTimeout(timeoutId);
        client.destroy();
        resolve(true);
      });
      
      client.on('error', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });
    });
  }
}

export default new NodeAdapter();