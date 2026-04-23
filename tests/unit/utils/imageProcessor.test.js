import ImageProcessor from '../../../src/utils/imageProcessor.js';
import fs from 'fs';
import path from 'path';

describe('ImageProcessor', () => {
  let processor;
  let testImageBuffer;

  beforeAll(() => {
    processor = new ImageProcessor();
    // Создаем тестовое изображение (1x1 черный пиксель)
    testImageBuffer = Buffer.from([0]);
  });

  test('should validate image format', () => {
    const validFile = { type: 'image/png', size: 1024 };
    const invalidFile = { type: 'video/mp4', size: 1024 };
    
    expect(() => processor.validateImage(validFile)).not.toThrow();
    expect(() => processor.validateImage(invalidFile)).toThrow();
  });

  test('should validate image size', () => {
    const largeFile = { type: 'image/png', size: 3 * 1024 * 1024 };
    expect(() => processor.validateImage(largeFile)).toThrow();
  });

  test('should convert to monochrome', async () => {
    const result = await processor.convertToMonochrome(testImageBuffer);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should resize image', async () => {
    const result = await processor.resizeImage(testImageBuffer, 100);
    expect(result).toBeInstanceOf(Buffer);
  });

  test('should convert to ESC/POS format', async () => {
    const result = await processor.convertToEscPos(testImageBuffer);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should generate sticker HTML', () => {
    const html = processor.generateStickerHTML({ wasteType: 'Plastic' });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Plastic');
  });
});