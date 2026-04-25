import UsbPrinter from "../../../src/printers/UsbPrinter.js";
import { PrinterError, ErrorCodes } from "../../../src/core/PrinterError.js";

// Мокаем usb модуль
const mockUsbInterface = {
  claim: jest.fn(),
  release: jest.fn((releaseInterface, callback) => {
    if (callback) process.nextTick(() => callback(null));
  }),
  isKernelDriverActive: jest.fn().mockReturnValue(true),
  detachKernelDriver: jest.fn(),
  endpoints: [
    {
      direction: "out",
      transfer: jest.fn((data, callback) => {
        process.nextTick(() => callback(null));
      }),
    },
  ],
};

const mockUsbDevice = {
  open: jest.fn(),
  close: jest.fn(),
  interface: jest.fn(() => mockUsbInterface),
  deviceDescriptor: {
    idVendor: 0x04b8,
    idProduct: 0x0e15,
    bDeviceClass: 0,
  },
};

jest.mock("usb", () => ({
  getDeviceList: jest.fn().mockReturnValue([mockUsbDevice]),
}));

describe("UsbPrinter", () => {
  let printer;

  beforeEach(() => {
    printer = new UsbPrinter();
    jest.clearAllMocks();
  });

  // ========== ТЕСТЫ DISCOVER ==========
  describe("discover", () => {
    test("should discover USB printers", async () => {
      const printers = await printer.discover();

      expect(printers).toBeInstanceOf(Array);
      expect(printers.length).toBe(1);
      expect(printers[0]).toMatchObject({
        vendorId: 0x04b8,
        productId: 0x0e15,
        name: expect.stringContaining("USB Printer"),
        type: "usb",
      });
    });

    test("should handle discovery errors gracefully", async () => {
      const usb = require("usb");
      usb.getDeviceList.mockImplementationOnce(() => {
        throw new Error("USB enumeration failed");
      });

      const printers = await printer.discover();
      expect(printers).toEqual([]);
    });
  });

  // ========== ТЕСТЫ ОПРЕДЕЛЕНИЯ ПРИНТЕРА ==========
  describe("isLikelyPrinter", () => {
    test("should recognize printer class devices", () => {
      const printerClassDevice = {
        deviceDescriptor: {
          bDeviceClass: 7,
          idVendor: 0x1234,
          idProduct: 0x5678,
        },
      };
      expect(
        printer._isLikelyPrinter(printerClassDevice.deviceDescriptor),
      ).toBe(true);
    });

    test("should recognize known printer vendors", () => {
      const knownPrinters = [
        { idVendor: 0x04b8, idProduct: 0x0e15 }, // Epson
        { idVendor: 0x067b, idProduct: 0x2305 }, // Prolific
        { idVendor: 0x0416, idProduct: 0x5011 }, // WinChipHead
        { idVendor: 0x1504, idProduct: 0x0006 }, // Bixolon
      ];

      knownPrinters.forEach(({ idVendor, idProduct }) => {
        const device = {
          deviceDescriptor: { bDeviceClass: 0, idVendor, idProduct },
        };
        expect(printer._isLikelyPrinter(device.deviceDescriptor)).toBe(true);
      });
    });

    test("should reject non-printer devices", () => {
      const nonPrinter = {
        deviceDescriptor: {
          bDeviceClass: 0,
          idVendor: 0x8086,
          idProduct: 0x1234,
        },
      };
      expect(printer._isLikelyPrinter(nonPrinter.deviceDescriptor)).toBe(false);
    });
  });

  // ========== ТЕСТЫ CONNECT ==========
  describe("connect", () => {
    test("should connect to USB printer successfully", async () => {
      const printers = await printer.discover();
      const config = printers[0];

      const result = await printer.connect(config);

      expect(result).toEqual({ success: true });
      expect(printer.isConnected).toBe(true);
      expect(printer.device).toBeDefined();
      expect(printer.interface).toBeDefined();
      expect(printer.endpoint).toBeDefined();
    });

    test("should detach kernel driver if active", async () => {
      const printers = await printer.discover();
      const config = printers[0];

      await printer.connect(config);

      expect(mockUsbInterface.isKernelDriverActive).toHaveBeenCalled();
      expect(mockUsbInterface.detachKernelDriver).toHaveBeenCalled();
    });

    test("should throw error if output endpoint not found", async () => {
      const usb = require("usb");
      const deviceWithoutEndpoint = {
        ...mockUsbDevice,
        interface: jest.fn(() => ({
          ...mockUsbInterface,
          endpoints: [], // Нет endpoint'ов
        })),
      };
      usb.getDeviceList.mockReturnValueOnce([deviceWithoutEndpoint]);

      const printers = await printer.discover();
      const config = printers[0];

      await expect(printer.connect(config)).rejects.toThrow(
        ErrorCodes.CONNECTION_FAILED,
      );
      await expect(printer.connect(config)).rejects.toThrow(
        "Output endpoint not found",
      );
    });
  });

  // ========== ТЕСТЫ PRINT ==========
  describe("print", () => {
    beforeEach(async () => {
      const printers = await printer.discover();
      await printer.connect(printers[0]);
    });

    test("should print data successfully", async () => {
      const testData = Buffer.from([0x1b, 0x40, 0x1d, 0x56, 0x41, 0x00]);
      const result = await printer.print(testData);

      expect(result).toEqual({ success: true });
      expect(printer.endpoint.transfer).toHaveBeenCalledWith(
        testData,
        expect.any(Function),
      );
    });

    test("should print string data by converting to buffer", async () => {
      const testString = "Test USB print";
      const result = await printer.print(testString);

      expect(result.success).toBe(true);
      expect(printer.endpoint.transfer).toHaveBeenCalledWith(
        Buffer.from(testString),
        expect.any(Function),
      );
    });

    test("should throw error when printer is not connected", async () => {
      const newPrinter = new UsbPrinter();
      await expect(newPrinter.print("test")).rejects.toThrow(PrinterError);
      await expect(newPrinter.print("test")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCodes.NOT_CONNECTED }),
      );
    });

    test("should handle transfer errors", async () => {
      mockUsbInterface.endpoints[0].transfer.mockImplementationOnce(
        (data, callback) => {
          process.nextTick(() => callback(new Error("Transfer failed")));
        },
      );

      await expect(printer.print("test")).rejects.toThrow(
        ErrorCodes.PRINT_FAILED,
      );
    });
  });

  // ========== ТЕСТЫ DISCONNECT ==========
  describe("disconnect", () => {
    beforeEach(async () => {
      const printers = await printer.discover();
      await printer.connect(printers[0]);
    });

    test("should disconnect successfully", async () => {
      expect(printer.isConnected).toBe(true);

      await printer.disconnect();

      expect(mockUsbInterface.release).toHaveBeenCalled();
      expect(mockUsbDevice.close).toHaveBeenCalled();
      expect(printer.isConnected).toBe(false);
    });

    test("should handle disconnect when not connected", async () => {
      const newPrinter = new UsbPrinter();
      await expect(newPrinter.disconnect()).resolves.not.toThrow();
    });
  });

  // ========== ТЕСТЫ КЕШИРОВАНИЯ ==========
  describe("device caching", () => {
    test("should reuse device reference", async () => {
      const printers = await printer.discover();
      const config = printers[0];

      await printer.connect(config);
      const firstDevice = printer.device;

      await printer.disconnect();
      await printer.connect(config);
      const secondDevice = printer.device;

      expect(firstDevice).toBe(secondDevice);
    });
  });
});
