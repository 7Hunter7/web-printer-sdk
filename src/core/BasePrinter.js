/**
 * Абстрактный класс для всех принтеров
 * @abstract
 */
class BasePrinter {
  constructor(config = {}) {
    if (this.constructor === BasePrinter) {
      throw new Error('BasePrinter is abstract class');
    }
    
    this.config = config;
    this.isConnected = false;
    this.connection = null;
  }

  /**
   * Поиск доступных принтеров
   * @returns {Promise<Array>}
   */
  async discover() {
    throw new Error('Method discover() must be implemented');
  }

  /**
   * Подключение к принтеру
   * @param {Object} config 
   * @returns {Promise<void>}
   */
  async connect(config) {
    throw new Error('Method connect() must be implemented');
  }

  /**
   * Отправка данных на печать
   * @param {Buffer|string} data 
   * @returns {Promise<void>}
   */
  async print(data) {
    throw new Error('Method print() must be implemented');
  }

  /**
   * Отключение от принтера
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('Method disconnect() must be implemented');
  }

  /**
   * Проверка подключения
   * @returns {boolean}
   */
  getConnected() {
    return this.isConnected;
  }
}

export default BasePrinter;