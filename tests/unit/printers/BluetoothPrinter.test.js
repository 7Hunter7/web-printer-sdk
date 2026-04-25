import BluetoothPrinter from "../../../src/printers/BluetoothPrinter.js";
import { PrinterError, ErrorCodes } from "../../../src/core/PrinterError.js";

// Мокаем serialport
jest.mock("serialport", () => ({
  SerialPort: jest.fn().mockImplementation((config) => ({
    on: jest.fn((event, callback) => {
      if (event === "open") {
        process.nextTick(() => callback());
      }
      return { on: jest.fn() };
    }),
    write: jest.fn((data, callback) => {
      process.nextTick(() => callback(null));
      return true;
    }),
    drain: jest.fn((callback) => {
      process.nextTick(() => callback());
    }),
    close: jest.fn(),
    isOpen: true,
  })),
  list: jest.fn().mockResolvedValue([
    {
      path: "COM3",
      manufacturer: "Bluetooth Printer",
      pnpId: "BLUETOOTH\\PRINTER\\1234",
    },
    {
      path: "COM5",
      manufacturer: "Standard Serial over Bluetooth link",
      pnpId: "BLUETOOTH\\DEVICE\\5678",
    },
    {
      path: "COM10",
      manufacturer: "Generic USB Device",
      pnpId: "USB\\DEVICE\\9012",
    },
    { virtual: true },
  ]),
}));

describe("BluetoothPrinter", () => {
  let printer;

  beforeEach(() => {
    printer = new BluetoothPrinter();
    jest.clearAllMocks();
  });

  // ========== ТЕСТЫ DISCOVER ==========
  describe("discover", () => {
    test("should discover Bluetooth printers", async () => {
      const printers = await printer.discover();

      expect(printers).toBeInstanceOf(Array);
      expect(printers.length).toBe(2);
      expect(printers[0]).toMatchObject({
        path: "COM3",
        manufacturer: "Bluetooth Printer",
        name: expect.stringContaining("Bluetooth Printer"),
        type: "bluetooth-serial",
      });
    });

    test("should handle discovery errors gracefully", async () => {
      const { SerialPort } = require("serialport");
      SerialPort.list.mockRejectedValueOnce(new Error("Connection failed"));

      const printers = await printer.discover();
      expect(printers).toEqual([]);
    });
  });

  // ========== ТЕСТЫ CONNECT ==========
  describe("connect", () => {
    test("should connect to Bluetooth printer successfully", async () => {
      const config = { path: "COM3" };
      const result = await printer.connect(config);

      expect(result).toEqual({ success: true });
      expect(printer.isConnected).toBe(true);
      expect(printer.port).toBeDefined();
    });

    test("should throw error when path is missing", async () => {
      await expect(printer.connect({})).rejects.toThrow(PrinterError);
      await expect(printer.connect({})).rejects.toThrow(
        expect.objectContaining({ code: ErrorCodes.MISSING_CONFIG }),
      );
    });

    test("should throw error on connection failure", async () => {
      const { SerialPort } = require("serialport");
      SerialPort.mockImplementationOnce(() => ({
        on: jest.fn((event, callback) => {
          if (event === "error") {
            process.nextTick(() => callback(new Error("Connection refused")));
          }
          return { on: jest.fn() };
        }),
      }));

      const config = { path: "COM3" };
      await expect(printer.connect(config)).rejects.toThrow(
        ErrorCodes.CONNECTION_FAILED,
      );
    });
  });

  // ========== ТЕСТЫ PRINT ==========
  describe("print", () => {
    beforeEach(async () => {
      await printer.connect({ path: "COM3" });
    });

    test("should print data successfully", async () => {
      const testData = Buffer.from([0x1b, 0x40, 0x1b, 0x69]);
      const result = await printer.print(testData);

      expect(result).toEqual({
        success: true,
        bytesWritten: testData.length,
      });
      expect(printer.port.write).toHaveBeenCalledWith(
        testData,
        expect.any(Function),
      );
    });

    test("should print string data by converting to buffer", async () => {
      const testString = "Test print data";
      const result = await printer.print(testString);

      expect(result.success).toBe(true);
      expect(printer.port.write).toHaveBeenCalledWith(
        Buffer.from(testString),
        expect.any(Function),
      );
    });

    test("should throw error when printer is not connected", async () => {
      const newPrinter = new BluetoothPrinter();
      await expect(newPrinter.print("test")).rejects.toThrow(PrinterError);
      await expect(newPrinter.print("test")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCodes.NOT_CONNECTED }),
      );
    });

    test("should handle write errors", async () => {
      const { SerialPort } = require("serialport");
      SerialPort.mockImplementationOnce(() => ({
        on: jest.fn((event, callback) => {
          if (event === "open") {
            process.nextTick(() => callback());
          }
          return { on: jest.fn() };
        }),
        write: jest.fn((data, callback) => {
          process.nextTick(() => callback(new Error("Write failed")));
        }),
        drain: jest.fn(),
        isOpen: true,
      }));

      const tempPrinter = new BluetoothPrinter();
      await tempPrinter.connect({ path: "COM3" });
      await expect(tempPrinter.print("test")).rejects.toThrow(
        ErrorCodes.PRINT_FAILED,
      );
    });
  });

  // ========== ТЕСТЫ DISCONNECT ==========
  describe("disconnect", () => {
    test("should disconnect successfully", async () => {
      await printer.connect({ path: "COM3" });
      expect(printer.isConnected).toBe(true);

      await printer.disconnect();
      expect(printer.isConnected).toBe(false);
      expect(printer.port).toBeNull();
    });

    test("should handle disconnect when not connected", async () => {
      const newPrinter = new BluetoothPrinter();
      await expect(newPrinter.disconnect()).resolves.not.toThrow();
      expect(newPrinter.isConnected).toBe(false);
    });
  });

  // ========== ТЕСТЫ ДЛЯ РАЗНЫХ СКОРОСТЕЙ ==========
  describe("baud rate configuration", () => {
    test("should use default baud rate 9600", async () => {
      const { SerialPort } = require("serialport");
      const config = { path: "COM3" };

      await printer.connect(config);

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({ baudRate: 9600 }),
      );
    });

    test("should accept custom baud rate", async () => {
      const { SerialPort } = require("serialport");
      const customPrinter = new BluetoothPrinter({ baudRate: 19200 });
      const config = { path: "COM3" };

      await customPrinter.connect(config);

      expect(SerialPort).toHaveBeenCalledWith(
        expect.objectContaining({ baudRate: 19200 }),
      );
    });
  });
});
