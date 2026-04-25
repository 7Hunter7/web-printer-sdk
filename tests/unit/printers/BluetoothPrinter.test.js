import BluetoothPrinter from "../../../src/printers/BluetoothPrinter.js";
import { PrinterError, ErrorCodes } from "../../../src/core/PrinterError.js";
const isNodeEnvironment = typeof window === 'undefined';

// Мокаем serialport
jest.mock(
  "serialport",
  () => {
    const mockWrite = jest.fn((data, callback) => {
      if (callback) process.nextTick(() => callback(null));
      return true;
    });

    const mockDrain = jest.fn((callback) => {
      process.nextTick(() => callback());
    });

    // Создаем класс SerialPort
    class MockSerialPort {
      constructor(config) {
        this.config = config;
        this.isOpen = true;
        this.write = mockWrite;
        this.drain = mockDrain;

        // Эмулируем открытие порта
        process.nextTick(() => {
          if (this.onOpenCallback) this.onOpenCallback();
        });
      }
      on(event, callback) {
        if (event === "open") {
          this.onOpenCallback = callback;
        }
        if (event === "error") {
          this.onErrorCallback = callback;
        }
        return this;
      }
      close() {}
    }
    // Добавляем статический метод list
    MockSerialPort.list = jest.fn().mockResolvedValue([
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
    ]);
    return { SerialPort: MockSerialPort };
  },
  { virtual: false },
);

describe("BluetoothPrinter", () => {
  // Пропускаем тесты, требующие SerialPort, если не в Node
  const testOrSkip = isNodeEnvironment ? test : test.skip;
  let printer;

  beforeEach(() => {
    printer = new BluetoothPrinter();
    jest.clearAllMocks();
  });

  // ========== ТЕСТЫ DISCOVER ==========
  describe("discover", () => {
    test("should discover Bluetooth printers", async () => {
      const { SerialPort } = require("serialport");
      // Убеждаемся, что list существует
      expect(SerialPort.list).toBeDefined();
      expect(typeof SerialPort.list).toBe("function");

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
      // Сохраняем оригинальную функцию
      const originalList = SerialPort.list;
      SerialPort.list = jest
        .fn()
        .mockRejectedValue(new Error("Connection failed"));

      await expect(printer.discover()).rejects.toThrow(PrinterError);
      await expect(printer.discover()).rejects.toThrow(
        expect.objectContaining({ code: ErrorCodes.DISCOVERY_FAILED }),
      );

      SerialPort.list = originalList;
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
      const originalImpl = SerialPort;

      // Временно заменяем конструктор
      SerialPort.mockImplementationOnce(() => {
        throw new Error("Connection refused");
      });

      const config = { path: "COM3" };
      await expect(printer.connect(config)).rejects.toThrow(
        expect.objectContaining({ code: ErrorCodes.CONNECTION_FAILED }),
      );
      // Восстанавливаем
      Object.assign(SerialPort, originalImpl);
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
      const config = { path: "COM3" };
      await printer.connect(config);
      expect(printer.baudRate).toBe(9600);
    });

    test("should accept custom baud rate", async () => {
      const customPrinter = new BluetoothPrinter({ baudRate: 19200 });
      const config = { path: "COM3" };
      await customPrinter.connect(config);
      expect(customPrinter.baudRate).toBe(19200);
    });
  });
});
