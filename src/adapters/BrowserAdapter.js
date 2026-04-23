/**
 * Браузерный адаптер для WebUSB, WebBluetooth API
 * Работает в браузере без дополнительных зависимостей
 */
class BrowserAdapter {
  constructor() {
    this.supported = {
      webUsb: typeof navigator !== 'undefined' && !!navigator.usb,
      webBluetooth: typeof navigator !== 'undefined' && !!navigator.bluetooth,
      webSerial: typeof navigator !== 'undefined' && !!navigator.serial
    };
  }

  /**
   * Проверка поддержки API
   */
  isSupported(type) {
    switch (type) {
      case 'usb': return this.supported.webUsb;
      case 'bluetooth': return this.supported.webBluetooth;
      case 'serial': return this.supported.webSerial;
      default: return false;
    }
  }

  /**
   * Получение списка USB устройств
   */
  async getUSBDevices() {
    if (!this.supported.webUsb) {
      throw new Error('WebUSB is not supported in this browser');
    }

    const devices = await navigator.usb.getDevices();
    return devices.map(device => ({
      id: `${device.vendorId}:${device.productId}`,
      vendorId: device.vendorId,
      productId: device.productId,
      name: device.productName || `USB Device (${device.vendorId}:${device.productId})`,
      device: device
    }));
  }

  /**
   * Запрос доступа к USB устройству
   */
  async requestUSBDevice(filters = []) {
    if (!this.supported.webUsb) {
      throw new Error('WebUSB is not supported in this browser');
    }

    const device = await navigator.usb.requestDevice({
      filters: filters.length ? filters : [
        { classCode: 7 }, // Printer class
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x067b }, // Prolific
        { vendorId: 0x0416 }, // WinChipHead
        { vendorId: 0x1504 }  // Bixolon
      ]
    });

    return {
      id: `${device.vendorId}:${device.productId}`,
      vendorId: device.vendorId,
      productId: device.productId,
      name: device.productName || `USB Printer`,
      device: device
    };
  }

  /**
   * Подключение к USB устройству
   */
  async connectUSB(device, config = {}) {
    await device.open();
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    await device.claimInterface(config.interfaceNumber || 0);
    
    // Поиск выходного endpoint
    const endpoint = device.configuration?.interfaces[0]?.alternate?.endpoints?.find(
      ep => ep.direction === 'out'
    );
    
    return { device, endpoint };
  }

  /**
   * Отправка данных через USB
   */
  async writeUSB(device, endpoint, data) {
    const buffer = new Uint8Array(data);
    await device.transferOut(endpoint.endpointNumber, buffer);
  }

  /**
   * Поиск Bluetooth устройств
   */
  async getBluetoothDevices() {
    if (!this.supported.webBluetooth) {
      throw new Error('WebBluetooth is not supported in this browser');
    }

    // Возвращаем ранее разрешенные устройства
    const devices = await navigator.bluetooth.getDevices();
    return devices.map(device => ({
      id: device.id,
      name: device.name || 'Unknown Bluetooth Device',
      device: device
    }));
  }

  /**
   * Запрос доступа к Bluetooth принтеру
   */
  async requestBluetoothPrinter() {
    if (!this.supported.webBluetooth) {
      throw new Error('WebBluetooth is not supported in this browser');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['00001801-0000-1000-8000-00805f9b34fb'] }, // Generic Access
        { namePrefix: 'Printer' },
        { namePrefix: 'POS' },
        { namePrefix: 'Thermal' }
      ],
      optionalServices: [
        '00001801-0000-1000-8000-00805f9b34fb',
        '0000180f-0000-1000-8000-00805f9b34fb' // Battery Service
      ]
    });

    return {
      id: device.id,
      name: device.name || 'Bluetooth Printer',
      device: device
    };
  }

  /**
   * Подключение к Bluetooth принтеру
   */
  async connectBluetooth(device) {
    const server = await device.gatt.connect();
    return { server, device };
  }

  /**
   * Получение сервиса характеристики для печати
   */
  async getPrintCharacteristic(server) {
    // Поиск сервиса для печати
    const services = await server.getPrimaryServices();
    
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char;
        }
      }
    }
    
    throw new Error('No writable characteristic found for printing');
  }

  /**
   * Отправка данных через Bluetooth
   */
  async writeBluetooth(characteristic, data) {
    const buffer = new Uint8Array(data);
    await characteristic.writeValue(buffer);
  }

  /**
   * Работа с Serial портами (WebSerial)
   */
  async requestSerialPort() {
    if (!this.supported.webSerial) {
      throw new Error('WebSerial is not supported in this browser');
    }

    const port = await navigator.serial.requestPort();
    return port;
  }

  /**
   * Открытие Serial порта
   */
  async openSerialPort(port, baudRate = 9600) {
    await port.open({ baudRate });
    return port;
  }

  /**
   * Отправка данных через Serial
   */
  async writeSerial(port, data) {
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
  }

  /**
   * Закрытие Serial порта
   */
  async closeSerialPort(port) {
    await port.close();
  }
}

export default new BrowserAdapter();