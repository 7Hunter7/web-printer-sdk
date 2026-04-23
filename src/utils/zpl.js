/**
 * ZPL (Zebra Programming Language) команды для печати этикеток
 */
export const ZPL = {
  // Команды формата
  start: '^XA',
  end: '^XZ',
  
  // Ориентация
  orientation: {
    portrait: '^POI',
    landscape: '^POL',
    inverted: '^POIb'
  },
  
  // Штрихкоды
  barcode: {
    code128: (data, options = {}) => {
      const x = options.x || 50;
      const y = options.y || 50;
      const height = options.height || 50;
      const readable = options.readable !== false;
      return `^FO${x},${y}^BY3,2,${height}^BCN,${height},${readable ? 'Y' : 'N'},N,N^FD${data}^FS`;
    },
    code39: (data, options = {}) => {
      const x = options.x || 50;
      const y = options.y || 50;
      const height = options.height || 50;
      return `^FO${x},${y}^BY3,2,${height}^B3N,N,${height},Y,N^FD${data}^FS`;
    },
    ean13: (data, options = {}) => {
      const x = options.x || 50;
      const y = options.y || 50;
      const height = options.height || 50;
      return `^FO${x},${y}^BY3,2,${height}^BE,N,${height},Y,N^FD${data}^FS`;
    },
    qrcode: (data, options = {}) => {
      const x = options.x || 50;
      const y = options.y || 50;
      const size = options.size || 5;
      return `^FO${x},${y}^BQN,2,${size}^FDMA,${data}^FS`;
    }
  },
  
  // Текст
  text: (text, options = {}) => {
    const x = options.x || 50;
    const y = options.y || 50;
    const font = options.font || '0';
    const size = options.size || '30,30';
    return `^FO${x},${y}^A${font},${size}^FD${text}^FS`;
  },
  
  // Шрифты
  font: {
    0: '^A0', // 15x16 dots
    1: '^A1', // 20x20 dots
    2: '^A2', // 24x24 dots
    3: '^A3', // 30x30 dots
    4: '^A4', // 36x36 dots
    5: '^A5', // 40x40 dots
    6: '^A6', // 48x48 dots
    7: '^A7', // 56x56 dots
    8: '^A8', // 60x60 dots
    9: '^A9'  // 70x70 dots
  },
  
  // Линии
  line: (x1, y1, x2, y2, options = {}) => {
    const width = options.width || 3;
    return `^FO${x1},${y1}^GB${Math.abs(x2 - x1)},${Math.abs(y2 - y1)},${width}^FS`;
  },
  
  // Прямоугольник
  rectangle: (x1, y1, width, height, options = {}) => {
    const borderWidth = options.borderWidth || 3;
    const color = options.color || 'B';
    return `^FO${x1},${y1}^GB${width},${height},${borderWidth}^FR,${color}^FS`;
  },
  
  // Круг/Эллипс
  circle: (x, y, radius, options = {}) => {
    const borderWidth = options.borderWidth || 3;
    return `^FO${x - radius},${y - radius}^GE${radius * 2},${radius * 2},${borderWidth}^FS`;
  },
  
  // Изображение
  image: (data, options = {}) => {
    const x = options.x || 50;
    const y = options.y || 50;
    const totalBytes = options.totalBytes || data.length;
    const bytesPerRow = options.bytesPerRow || 100;
    
    return `^FO${x},${y}^GFA,${totalBytes},${totalBytes},${bytesPerRow},${data}^FS`;
  },
  
  // Позиционирование
  position: (x, y) => `^FO${x},${y}`,
  
  // Feed
  feed: (dots) => `^FD${dots}`,
  feedBack: (dots) => `^FE${dots}`,
  
  // Отступы
  leftIndent: (dots) => `^LS${dots}`,
  labelLength: (dots) => `^LL${dots}`,
  
  // Количество копий
  copies: (count) => `^PQ${count}`,
  
  // Задержка между этикетками
  pause: (ms) => `^PC${ms}`,
  
  // Очистка памяти
  clearMemory: (type = 'all') => {
    const commands = {
      all: '^JMA',
      formats: '^JMF',
      fonts: '^JUF',
      graphics: '^JUS',
      images: '^JUU'
    };
    return commands[type] || commands.all;
  },
  
  // Конфигурация принтера
  config: {
    density: (value) => `^MD${value}`, // От -30 до 30
    speed: (value) => `^PR${value}`,   // Скорость печати
    darkness: (value) => `~SD${value}`, // Интенсивность печати
    mediaTracking: (type) => {
      const types = {
        web: '^MN',
        gap: '^MNG',
        notch: '^MNN',
        mark: '^MNM'
      };
      return types[type] || '^MN';
    }
  }
};

/**
 * Создание этикетки из данных
 */
export function createLabel(data, options = {}) {
  const commands = [ZPL.start];
  
  // Ориентация
  if (options.orientation) {
    commands.push(ZPL.orientation[options.orientation]);
  }
  
  // Размер этикетки
  if (options.width && options.height) {
    commands.push(`^PW${options.width}`);
    commands.push(`^LL${options.height}`);
  }
  
  // Заголовок
  if (data.header) {
    commands.push(ZPL.text(data.header, { x: 50, y: 20, font: '3', size: '40,40' }));
  }
  
  // Штрихкод
  if (data.barcode) {
    commands.push(ZPL.barcode.code128(data.barcode, { x: 50, y: 100, height: 80 }));
  }
  
  // QR код
  if (data.qrcode) {
    commands.push(ZPL.barcode.qrcode(data.qrcode, { x: 50, y: 200, size: 8 }));
  }
  
  // Текст
  let yPosition = 250;
  if (data.fields) {
    for (const field of data.fields) {
      commands.push(ZPL.text(field.label, { x: 50, y: yPosition, font: '0', size: '20,20' }));
      commands.push(ZPL.text(field.value, { x: 200, y: yPosition, font: '1', size: '25,25' }));
      yPosition += 30;
    }
  }
  
  commands.push(ZPL.end);
  
  return Buffer.from(commands.join(''), 'ascii');
}

/**
 * Создание этикетки для отходов (пример)
 */
export function createWasteLabel(wasteData) {
  return createLabel({
    header: 'WASTE STICKER',
    barcode: wasteData.id || Date.now().toString(),
    qrcode: wasteData.id || Date.now().toString(),
    fields: [
      { label: 'Type:', value: wasteData.type || 'Mixed' },
      { label: 'Weight:', value: `${wasteData.weight || 0} kg` },
      { label: 'Date:', value: wasteData.date || new Date().toLocaleDateString() },
      { label: 'Address:', value: wasteData.address || '—' }
    ]
  }, {
    orientation: 'portrait',
    width: 406,  // 4 дюйма
    height: 258  // ~2.5 дюйма
  });
}

/**
 * Сериализация ZPL команды в буфер
 */
export function serializeZPL(zplString) {
  return Buffer.from(zplString, 'ascii');
}