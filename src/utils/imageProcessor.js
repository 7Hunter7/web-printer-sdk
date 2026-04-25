import sharp from "sharp";

class ImageProcessor {
  constructor() {
    this.supportedFormats = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/bmp",
    ];
    this.maxSize = 2 * 1024 * 1024; // 2MB
  }

  /**
   * Проверка файла изображения
   */
  validateImage(file) {
    if (!this.supportedFormats.includes(file.type)) {
      throw new Error(
        `Unsupported image format. Supported: ${this.supportedFormats.join(", ")}`,
      );
    }

    if (file.size > this.maxSize) {
      throw new Error(
        `Image size exceeds ${this.maxSize / 1024 / 1024}MB limit`,
      );
    }

    return true;
  }

  /**
   * Конвертация изображения в черно-белое для термопринтера
   */
  async convertToMonochrome(imageBuffer, threshold = 128) {
    return await sharp(imageBuffer)
      .grayscale()
      .threshold(threshold)
      .png()
      .toBuffer();
  }

  /**
   * Изменение размера изображения
   */
  async resizeImage(imageBuffer, width, height = null) {
    const options = { width };
    if (height) options.height = height;

    return await sharp(imageBuffer).resize(options).toBuffer();
  }

  /**
   * Конвертация в ESC/POS формат
   */
  async convertToEscPos(imageBuffer, options = {}) {
    const {
      width = 384, // стандартная ширина для 58mm принтера
      threshold = 128,
      dithering = false,
    } = options;

    // Сначала изменяем размер
    const resized = await this.resizeImage(imageBuffer, width);
    // Конвертируем в черно-белое
    const monochrome = await this.convertToMonochrome(resized, threshold);
    // Получаем метаданные
    const metadata = await sharp(monochrome).metadata();
    // Генерируем ESC/POS команды для изображения
    const commands = [];
    // Команда для печати изображения (ESC * для графики)
    commands.push(0x1d, 0x76, 0x30, 0x00); // GS v 0 (печать растрового изображения)

    // Ширина и высота в байтах
    const widthBytes = Math.ceil(metadata.width / 8);
    commands.push((widthBytes >> 8) & 0xff, widthBytes & 0xff);
    commands.push((metadata.height >> 8) & 0xff, metadata.height & 0xff);
    // Получаем данные пикселей
    const { data } = await sharp(monochrome)
    // .raw() устарел, данные уже в raw формате
    .toBuffer({ resolveWithObject: true });

    // Конвертируем в битовую маску
    const bitData = this.convertToBitMask(
      data,
      metadata.width,
      metadata.height,
    );

    commands.push(...bitData);

    return Buffer.from(commands);
  }

  /**
   * Конвертация пикселей в битовую маску для ESC/POS
   */
  convertToBitMask(pixels, width, height) {
    const widthBytes = Math.ceil(width / 8);
    const result = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x += 8) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          if (x + bit < width) {
            const idx = (y * width) + (x + bit);
            const pixel = pixels[idx];
            // Если пиксель темный (черный) - ставим 1
            if (pixel < 128) {
              byte |= 1 << (7 - bit);
            }
          }
        }
        result.push(byte);
      }
    }

    return result;
  }

  /**
   * Генерация ZPL кода для изображения на этикетке
   */
  async convertToZPL(imageBuffer, options = {}) {
    const {
      width = 406, // стандартная ширина для 4x6 дюймов
      height = null,
      compression = true,
    } = options;

    // Изменяем размер
    let processed = await this.resizeImage(imageBuffer, width, height);
    // Конвертируем в черно-белое
    processed = await this.convertToMonochrome(processed);
    // Конвертируем в base64
    const base64 = processed.toString("base64");
    // ZPL команда для изображения
    let zpl = `^FO50,50^GFA,${base64.length},${base64.length},${Math.ceil(width / 8)},${base64}^FS`;

    return Buffer.from(zpl);
  }

  /**
   * Генерация HTML для печати
   */
  generateStickerHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sticker - ${data.id || "Unknown"}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f0f0f0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .sticker {
              width: 396px;
              height: 526px;
              padding: 8px 16px;
              background: white;
              border: 2px solid #281c1b;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
            }
            .sticker-content {
              display: flex;
              flex-direction: column;
              flex: 1;
              text-align: center;
            }
            .sticker-logo {
              margin-bottom: 8px;
            }
            .sticker-logo img {
              max-height: 60px;
            }
            .sticker-waste-type {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              font-size: 24px;
              font-weight: 600;
              margin: 8px 0;
              text-transform: capitalize;
            }
            .sticker-divider {
              padding: 8px 0;
              border-top: 2px solid #625856;
              border-bottom: 2px solid #625856;
            }
            .sticker-info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .sticker-label {
              color: #9b9797;
            }
            .sticker-value {
              font-weight: 600;
              color: #625856;
            }
            .sticker-barcode {
              margin: 16px 0;
              text-align: center;
            }
            .sticker-barcode canvas {
              max-width: 100%;
            }
            .sticker-motivation {
              margin-top: auto;
              font-size: 12px;
              text-align: center;
              color: #281c1b;
              background: #f5f5f5;
              padding: 8px;
              border-radius: 12px;
            }
            @media print {
              body {
                background: white;
              }
              .sticker {
                border: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="sticker-content">
              <div class="sticker-logo">
                <img src="${data.logoUrl || "/Logo.png"}" alt="Logo" />
              </div>
              <div class="sticker-waste-type">
                <span>${data.wasteIcon || "🗑️"}</span>
                <span>${data.wasteType || "Waste"}</span>
              </div>
              <div class="sticker-divider">
                <div class="sticker-info-row">
                  <span class="sticker-label">Address:</span>
                  <span class="sticker-value">${data.address || "—"}</span>
                </div>
                <div class="sticker-info-row">
                  <span class="sticker-label">Weight:</span>
                  <span class="sticker-value">${data.weight || "0"} kg</span>
                </div>
                <div class="sticker-info-row">
                  <span class="sticker-label">Date:</span>
                  <span class="sticker-value">${data.date || new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div class="sticker-barcode" id="barcode-container"></div>
              <div class="sticker-motivation">
                <p>By sorting waste, you take care of the future!</p>
                <p>Together we create a clean world!</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Генерация изображения через Puppeteer (Server-side)
   */
  async generateStickerImage(stickerData, usePuppeteer = false) {
    if (usePuppeteer && typeof window === "undefined") {
      return await this._generateWithPuppeteer(stickerData);
    }
    return this.generateStickerHTML(stickerData);
  }

  /**
   * Генерация через Puppeteer (для сервера)
   */
  async _generateWithPuppeteer(stickerData) {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 396, height: 526 });
      await page.setContent(this.generateStickerHTML(stickerData));

      // Добавляем штрихкод
      await page.evaluate(
        (barcodeData) => {
          if (typeof JsBarcode !== "undefined") {
            const container = document.getElementById("barcode-container");
            const canvas = document.createElement("canvas");
            container.appendChild(canvas);
            JsBarcode(canvas, barcodeData, {
              format: "CODE128",
              width: 2,
              height: 40,
            });
          }
        },
        stickerData.barcodeData || stickerData.id || Date.now().toString(),
      );

      const screenshot = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: 396, height: 526 },
      });

      return screenshot;
    } finally {
      await browser.close();
    }
  }
}

export default ImageProcessor;
