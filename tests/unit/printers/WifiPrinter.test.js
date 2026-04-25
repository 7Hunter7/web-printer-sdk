import WifiPrinter from "../../../src/printers/WifiPrinter.js";
import { PrinterError } from "../../../src/core/PrinterError.js";

// Мокаем net модуль
const mockSocket = {
  connect: jest.fn(),
  on: jest.fn().mockReturnThis(),
  write: jest.fn(),
  end: jest.fn(),
  destroy: jest.fn(),
};

jest.mock("net", () => ({
  Socket: jest.fn(() => mockSocket),
}));

describe("WifiPrinter", () => {
  let printer;
  let mockNet;

  beforeEach(() => {
    printer = new WifiPrinter();
    mockNet = require("net");
    jest.clearAllMocks();
  });

  test("should generate common IPs", () => {
    const ips = printer._generateCommonIPs();
    expect(ips.length).toBeGreaterThan(100);
    expect(ips[0]).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });

  test("should check printer availability", async () => {
    const result = await printer._checkPrinter("127.0.0.1");
    expect(result).toBeDefined();
  });

  test("should connect to printer", async () => {
    const config = { ip: "192.168.1.100", port: 9100 };
    const connectPromise = printer.connect(config);

    // Получаем функцию connect из мока
    const socketConstructor = mockNet.Socket;
    const socketInstance = socketConstructor.mock.results[0]?.value;

    if (socketInstance && socketInstance.connect) {
      // Вызываем callback успешного подключения
      const connectCall = socketInstance.connect.mock.calls[0];
      if (connectCall && typeof connectCall[2] === "function") {
        connectCall[2](); // Вызываем callback
      }
    }

    await expect(connectPromise).resolves.toBeDefined();
  });

  test("should throw error on connection timeout", async () => {
    printer.timeout = 100;
    const config = { ip: "192.168.1.100", port: 9100 };

    // Simulate timeout
    setTimeout(() => {
      const errorCallback = mockNet.Socket.mock.calls[0][0].on.mock.calls.find(
        (call) => call[0] === "error",
      );
      if (errorCallback) {
        errorCallback[1](new Error("Timeout"));
      }
    }, 50);

    await expect(printer.connect(config)).rejects.toThrow();
  });
});
