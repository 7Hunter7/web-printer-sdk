/**
 * Vue миксин для интеграции с принтером
 */
export const printerMixin = {
  data() {
    return {
      printerManager: null,
      isPrinterConnected: false,
      printerError: null,
      availablePrinters: [],
      isPrinting: false
    };
  },

  async created() {
    const { default: PrinterManager } = await import('../core/PrinterManager.js');
    this.printerManager = new PrinterManager();
    
    // Загружаем сохраненную конфигурацию
    const savedConfig = this.getPrinterConfig();
    if (savedConfig && savedConfig.type) {
      try {
        this.printerManager.setPrinterType(savedConfig.type, savedConfig);
        this.isPrinterConnected = this.printerManager.isConnected();
      } catch (error) {
        console.warn('Failed to restore printer config:', error);
      }
    }
  },

  methods: {
    /**
     * Установка типа принтера
     */
    setPrinterType(type, config = {}) {
      this.printerManager.setPrinterType(type, config);
      this.savePrinterConfig({ type, ...config });
    },

    /**
     * Поиск принтеров
     */
    async discoverPrinters() {
      try {
        this.printerError = null;
        this.availablePrinters = await this.printerManager.discover();
        return this.availablePrinters;
      } catch (error) {
        this.printerError = error.message;
        return [];
      }
    },

    /**
     * Подключение к принтеру
     */
    async connectPrinter(config) {
      try {
        this.printerError = null;
        const result = await this.printerManager.connect(config);
        this.isPrinterConnected = true;
        this.savePrinterConfig(config);
        return result;
      } catch (error) {
        this.printerError = error.message;
        throw error;
      }
    },

    /**
     * Печать
     */
    async print(data) {
      if (!this.isPrinterConnected) {
        throw new Error('Printer is not connected');
      }
      
      try {
        this.isPrinting = true;
        this.printerError = null;
        const result = await this.printerManager.print(data);
        return result;
      } catch (error) {
        this.printerError = error.message;
        throw error;
      } finally {
        this.isPrinting = false;
      }
    },

    /**
     * Отключение
     */
    async disconnectPrinter() {
      try {
        await this.printerManager.disconnect();
        this.isPrinterConnected = false;
      } catch (error) {
        this.printerError = error.message;
      }
    },

    /**
     * Сохранение конфигурации
     */
    savePrinterConfig(config) {
      localStorage.setItem('printerConfig', JSON.stringify(config));
      if (this.$store) {
        this.$store.commit('printerSettings/SET_PRINTER_CONFIG', config);
      }
    },

    /**
     * Получение конфигурации
     */
    getPrinterConfig() {
      const localConfig = localStorage.getItem('printerConfig');
      if (localConfig) {
        return JSON.parse(localConfig);
      }
      if (this.$store?.getters?.['printerSettings/printerConfig']) {
        return this.$store.getters['printerSettings/printerConfig'];
      }
      return null;
    }
  }
};

export default printerMixin;