// TypeScript определения
declare module "web-printer-sdk" {
  export interface PrinterConfig {
    type: "wifi" | "bluetooth" | "usb" | "thermal" | "virtual";
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

  export function createPrinter(
    type: string,
    config?: PrinterConfig,
  ): Promise<PrinterManager>;

  export const VERSION: string;

  // ========== ZPL интерфейсы ==========
  export interface BarcodeOptions {
    x?: number;
    y?: number;
    height?: number;
    readable?: boolean;
  }

  export interface QROptions {
    x?: number;
    y?: number;
    size?: number;
  }

  export interface TextOptions {
    x?: number;
    y?: number;
    font?: string;
    size?: string;
  }

  export interface LineOptions {
    width?: number;
  }

  export interface RectangleOptions {
    borderWidth?: number;
    color?: "B" | "W";
  }

  export interface CircleOptions {
    borderWidth?: number;
  }

  export interface ImageOptions {
    x?: number;
    y?: number;
    totalBytes?: number;
    bytesPerRow?: number;
  }

  export interface LabelData {
    header?: string;
    barcode?: string;
    qrcode?: string;
    fields?: Array<{ label: string; value: string }>;
  }

  export interface LabelOptions {
    orientation?: "portrait" | "landscape" | "inverted";
    width?: number;
    height?: number;
  }

  // ZPL объект
  export const ZPL: {
    start: string;
    end: string;
    orientation: {
      portrait: string;
      landscape: string;
      inverted: string;
    };
    barcode: {
      code128: (data: string, options?: BarcodeOptions) => string;
      code39: (data: string, options?: BarcodeOptions) => string;
      ean13: (data: string, options?: BarcodeOptions) => string;
      qrcode: (data: string, options?: QROptions) => string;
    };
    text: (text: string, options?: TextOptions) => string;
    font: Record<string, string>;
    line: (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      options?: LineOptions,
    ) => string;
    rectangle: (
      x1: number,
      y1: number,
      width: number,
      height: number,
      options?: RectangleOptions,
    ) => string;
    circle: (
      x: number,
      y: number,
      radius: number,
      options?: CircleOptions,
    ) => string;
    image: (data: string, options?: ImageOptions) => string;
    position: (x: number, y: number) => string;
    feed: (dots: number) => string;
    feedBack: (dots: number) => string;
    leftIndent: (dots: number) => string;
    labelLength: (dots: number) => string;
    copies: (count: number) => string;
    pause: (ms: number) => string;
    clearMemory: (
      type?: "all" | "formats" | "fonts" | "graphics" | "images",
    ) => string;
    config: {
      density: (value: number) => string;
      speed: (value: number) => string;
      darkness: (value: number) => string;
      mediaTracking: (type: "web" | "gap" | "notch" | "mark") => string;
    };
  };

  export function createLabel(data: LabelData, options?: LabelOptions): Buffer;
  export function createWasteLabel(wasteData: Record<string, any>): Buffer;
  export function serializeZPL(zplString: string): Buffer;

  // ========== ImageProcessor интерфейсы ==========
  export class ImageProcessor {
    validateImage(file: File): boolean;
    convertToMonochrome(
      imageBuffer: Buffer,
      threshold?: number,
    ): Promise<Buffer>;
    resizeImage(
      imageBuffer: Buffer,
      width: number,
      height?: number,
    ): Promise<Buffer>;
    convertToEscPos(imageBuffer: Buffer, options?: any): Promise<Buffer>;
    convertToZPL(imageBuffer: Buffer, options?: any): Promise<Buffer>;
    generateStickerHTML(data: any): string;
    generateStickerImage(
      stickerData: any,
      usePuppeteer?: boolean,
    ): Promise<string | Buffer>;
  }

  // ========== ESC/POS интерфейсы ==========
  export function createTextLine(text: string, alignment?: string): Buffer;
  export function createReceipt(items: any[], total: number): Buffer;

  // ========== Экспорт по умолчанию ==========
  const webPrinterSDK: {
    PrinterManager: typeof PrinterManager;
    BasePrinter: typeof BasePrinter;
    PrinterError: typeof PrinterError;
    ErrorCodes: typeof ErrorCodes;
    WifiPrinter: typeof WifiPrinter;
    BluetoothPrinter: typeof BluetoothPrinter;
    UsbPrinter: typeof UsbPrinter;
    ThermalPrinter: typeof ThermalPrinter;
    VirtualPrinter: typeof VirtualPrinter;
    ESCPOS: typeof ESCPOS;
    ZPL: typeof ZPL;
    createTextLine: typeof createTextLine;
    createReceipt: typeof createReceipt;
    createLabel: typeof createLabel;
    createWasteLabel: typeof createWasteLabel;
    serializeZPL: typeof serializeZPL;
    ImageProcessor: typeof ImageProcessor;
    printerMixin: typeof printerMixin;
    VERSION: string;
  };

  export default webPrinterSDK;
}