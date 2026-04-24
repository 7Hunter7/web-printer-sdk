import iconv from 'iconv-lite';

export const ESCPOS = {
  // Инициализация
  init: [0x1B, 0x40],
  
  // Выравнивание
  align: {
    left: [0x1B, 0x61, 0x00],
    center: [0x1B, 0x61, 0x01],
    right: [0x1B, 0x61, 0x02]
  },
  
  // Шрифты
  font: {
    normal: [0x1B, 0x21, 0x00],
    bold: [0x1B, 0x45, 0x01],
    boldOff: [0x1B, 0x45, 0x00],
    doubleHeight: [0x1B, 0x21, 0x10],
    doubleWidth: [0x1B, 0x21, 0x20],
    doubleSize: [0x1D, 0x21, 0x11]
  },
  
  // Feed и обрезка
  feed: (lines) => [0x1B, 0x64, lines],
  cut: [0x1B, 0x69],
  cutPartial: [0x1D, 0x56, 0x41, 0x00],
  cutFull: [0x1D, 0x56, 0x42, 0x00],
  
  // Текст
  text: (str) => iconv.encode(str + '\n', 'cp866'), // Для кириллицы
  // text: (str) =>  Buffer.from(str, 'utf8'); // Без кодировки
  
  // Штрихкод
  barcode: {
    code128: (data) => Buffer.concat([
      Buffer.from([0x1D, 0x6B, 0x49]),
      Buffer.from([data.length]),
      Buffer.from(data),
      Buffer.from([0x00])
    ])
  },
  
  // Изображение (черно-белое)
  image: (width, height, data) => {
    const commands = [0x1D, 0x76, 0x30, 0x00];
    commands.push(width >> 8, width & 0xFF);
    commands.push(height >> 8, height & 0xFF);
    return Buffer.concat([
      Buffer.from(commands),
      Buffer.from(data)
    ]);
  }
};

export function createTextLine(text, alignment = 'left') {
  return Buffer.concat([
    Buffer.from(ESCPOS.align[alignment]),
    ESCPOS.text(text),
    Buffer.from([0x0A]) // New line
  ]);
}

export function createReceipt(items, total) {
  const commands = [Buffer.from(ESCPOS.init)];
  
  // Заголовок по центру
  commands.push(createTextLine('=== ЧЕК ===', 'center'));
  commands.push(createTextLine(''));
  
  // Товары
  items.forEach(item => {
    commands.push(createTextLine(`${item.name} x${item.qty} = ${item.price * item.qty} руб.`));
  });
  
  commands.push(createTextLine(''));
  commands.push(createTextLine(`ИТОГО: ${total} руб.`, 'center'));
  commands.push(createTextLine('Спасибо за покупку!', 'center'));
  
  commands.push(createTextLine(''));
  commands.push(Buffer.from(ESCPOS.cut));
  
  return Buffer.concat(commands);
}