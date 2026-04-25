// Для тестирования
import BasePrinter from "../core/BasePrinter.js";
import { PrinterError, ErrorCodes } from "../core/PrinterError.js";

class VirtualPrinter extends BasePrinter {
  constructor(config = {}) {
    super(config);
    this.printHistory = [];
  }

  async discover() {
    return [
      {
        id: "virtual-1",
        name: "Virtual Printer (Test)",
        type: "virtual",
        description: "Test printer that captures print data",
      },
    ];
  }

  async connect(config) {
    this.isConnected = true;
    this.config = { ...this.config, ...config };
    return { success: true, message: "Connected to virtual printer" };
  }

  async print(data) {
    if (!this.isConnected) {
      throw new PrinterError(
        ErrorCodes.NOT_CONNECTED,
        "Virtual printer is not connected",
      );
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    const printJob = {
      timestamp: new Date().toISOString(),
      data: buffer.toString(),
      size: buffer.length,
      type: Buffer.isBuffer(data) ? "buffer" : "string",
    };

    this.printHistory.push(printJob);

    console.log("[VirtualPrinter] Print job received:", {
      size: printJob.size,
      preview:
        printJob.data.substring(0, 100) +
        (printJob.data.length > 100 ? "..." : ""),
    });

    return {
      success: true,
      message: "Print job captured",
      jobId: this.printHistory.length - 1,
      preview: printJob.data.substring(0, 200),
      bytesWritten: buffer.length,
    };
  }

  async disconnect() {
    this.isConnected = false;
  }

  getHistory() {
    return [...this.printHistory];
  }

  clearHistory() {
    this.printHistory = [];
  }

  getLastJob() {
    return this.printHistory.length > 0
      ? this.printHistory[this.printHistory.length - 1]
      : null;
  }
}

export default VirtualPrinter;
