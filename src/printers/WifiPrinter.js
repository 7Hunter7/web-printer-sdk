import net from 'net';
import BasePrinter from '../core/BasePrinter.js';
import { PrinterError, ErrorCodes } from '../core/PrinterError.js';

class WifiPrinter extends BasePrinter {
  constructor(config = {}) {
    super(config);
    this.timeout = config.timeout || 5000;
    this.scanTimeout = config.scanTimeout || 1000;
    this.client = null;
  }

  async discover() {
    const commonIPs = this._generateCommonIPs();
    const discovered = [];
    const batchSize = 50;

    for (let i = 0; i < commonIPs.length; i += batchSize) {
      const batch = commonIPs.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(ip => this._checkPrinter(ip))
      );
      
      const validPrinters = batchResults
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
      
      discovered.push(...validPrinters);
    }

    return discovered;
  }

  _generateCommonIPs() {
    const ips = [];
    const networks = ['192.168.0.', '192.168.1.', '192.168.100.', '10.0.0.', '172.16.0.'];
    
    networks.forEach(baseIP => {
      for (let i = 1; i <= 100; i++) {
        ips.push(`${baseIP}${i}`);
      }
    });
    return ips;
  }

  async _checkPrinter(ip, port = 9100) {
    return new Promise((resolve) => {
      const client = new net.Socket();
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          client.destroy();
          resolve(null);
        }
      }, this.scanTimeout);

      client.connect(port, ip, () => {
        clearTimeout(timeoutId);
        resolved = true;
        client.destroy();
        resolve({
          id: `${ip}:${port}`,
          ip,
          port,
          name: `WiFi Printer (${ip}:${port})`,
          type: 'wifi'
        });
      });

      client.on('error', () => {
        if (!resolved) {
          clearTimeout(timeoutId);
          resolved = true;
          resolve(null);
        }
      });
    });
  }

  async connect(config) {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();
      
      const timeoutId = setTimeout(() => {
        this.client.destroy();
        reject(new PrinterError(ErrorCodes.CONNECTION_FAILED, `Connection timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.client.connect(config.port || 9100, config.ip, () => {
        clearTimeout(timeoutId);
        this.isConnected = true;
        this.config = { ...this.config, ...config };
        resolve({ success: true, message: `Connected to ${config.ip}:${config.port}` });
      });

      this.client.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new PrinterError(ErrorCodes.CONNECTION_FAILED, err.message));
      });
    });
  }

  async print(data) {
    if (!this.isConnected || !this.client) {
      throw new PrinterError(ErrorCodes.NOT_CONNECTED, 'Printer is not connected');
    }

    return new Promise((resolve, reject) => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      this.client.write(buffer, (err) => {
        if (err) {
          reject(new PrinterError(ErrorCodes.PRINT_FAILED, err.message));
          return;
        }
        
        this.client.end(() => {
          resolve({ success: true, bytesWritten: buffer.length });
        });
      });
    });
  }

  async disconnect() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.isConnected = false;
  }

  async test(ip, port = 9100) {
    try {
      await this._checkPrinter(ip, port);
      return { success: true, ip, port };
    } catch (error) {
      return { success: false, ip, port, error: error.message };
    }
  }
}

export default WifiPrinter;