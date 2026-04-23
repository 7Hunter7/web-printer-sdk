// TypeScript определения
declare module 'web-printer-sdk' {
  export interface PrinterConfig {
    type: 'wifi' | 'bluetooth' | 'usb' | 'thermal' | 'virtual';
    ip?: string;
    port?: number;
    path?: string;
    address?: string;
    vendorId?: number;
    productId?: number;
    baudRate?: number;
    timeout?: number;
    charSet?: string;
    width?: number;
  }

  export interface PrintResult {
    success: boolean;
    message?: string;
    bytesWritten?: number;
    error?: string;
  }

  export interface DiscoveredPrinter {
    id: string;
    name: string;
    type: string;
    ip?: string;
    port?: number;
    path?: string;
    vendorId?: number;
    productId?: number;
  }

  export class PrinterError extends Error {
    code: string;
  }

  export class BasePrinter {
    constructor(config?: PrinterConfig);
    discover(): Promise<DiscoveredPrinter[]>;
    connect(config: PrinterConfig): Promise<PrintResult>;
    print(data: string | Buffer): Promise<PrintResult>;
    disconnect(): Promise<void>;
    getConnected(): boolean;
  }

  export class WifiPrinter extends BasePrinter {}
  export class BluetoothPrinter extends BasePrinter {}
  export class UsbPrinter extends BasePrinter {}
  export class ThermalPrinter extends BasePrinter {}
  export class VirtualPrinter extends BasePrinter {}

  export class PrinterManager {
    setPrinterType(type: string, config?: PrinterConfig): BasePrinter;
    discover(): Promise<DiscoveredPrinter[]>;
    connect(config: PrinterConfig): Promise<PrintResult>;
    print(data: string | Buffer): Promise<PrintResult>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getPrinter(): BasePrinter | null;
  }

  export const printerMixin: any;
  export const ESCPOS: any;
  export const ZPL: any;
  export const createTextLine: (text: string, alignment?: string) => Buffer;
  export const createReceipt: (items: any[], total: number) => Buffer;

  export function createPrinter(type: string, config?: PrinterConfig): Promise<PrinterManager>;

  export const VERSION: string;
}