/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Client as WhatsAppClient, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ReplaySubject, Observable } from 'rxjs';

/**
 * Сервис для управления WhatsApp клиентом.
 * Инициализация запускается по требованию через эндпоинт, а не при старте приложения.
 * Гарантирует создание только одного экземпляра клиента.
 */
@Injectable()
export class WhatsAppService implements OnModuleDestroy {
  private client: WhatsAppClient | null = null;
  private readonly logger = new Logger(WhatsAppService.name);
  private eventsStream = new ReplaySubject<any>(1);

  // Флаги для управления состоянием, чтобы избежать повторной инициализации
  private isInitializing = false;
  private isReady = false;
  private readonly instanceId: string; // Уникальный ID для отладки экземпляра

  /**
   * Конструктор сервиса. Оставлен пустым, так как инициализация происходит по требованию.
   */
  constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    this.logger.log(
      `[ID: ${this.instanceId}] WhatsAppService создан в пассивном состоянии.`,
    );
  }

  /**
   * Запускает инициализацию WhatsApp клиента.
   * Метод защищен от повторных вызовов, если процесс уже запущен или завершен.
   * @throws {Error} если во время инициализации произошла ошибка.
   */
  async initAuth(): Promise<void> {
    // 🛡️ Главная защита от двойного запуска
    if (this.isReady || this.isInitializing) {
      this.logger.log(
        `[ID: ${this.instanceId}] Инициализация уже запущена или завершена. Повторный вызов проигнорирован.`,
      );
      return;
    }

    try {
      this.isInitializing = true;
      this.logger.log(
        `[ID: ${this.instanceId}] 🚀 Начинается инициализация WhatsApp клиента по запросу...`,
      );

      this.client = new WhatsAppClient({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true, // Поменяйте на false для визуальной отладки
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      this.setupEventHandlers();

      await this.client.initialize();
    } catch (err) {
      this.logger.error(
        `[ID: ${this.instanceId}] Критическая ошибка во время инициализации`,
        err,
      );
      // Сбрасываем флаги в случае полной неудачи
      this.isInitializing = false;
      this.isReady = false;
      // Пробрасываем ошибку выше, чтобы контроллер мог ее обработать
      throw err;
    }
  }

  /**
   * Настраивает все обработчики событий для клиента WhatsApp.
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', async (qr: string) => {
      try {
        const qrImage = await qrcode.toDataURL(qr);
        this.logger.log(
          `[ID: ${this.instanceId}] 📲 Сгенерирован QR-код. Отправка в поток SSE...`,
        );
        this.eventsStream.next({ type: 'qr', data: qrImage });
        qrcode.generate(qr, { small: true }); // Также выводим в консоль для удобства
      } catch (qrErr) {
        this.logger.error(
          `[ID: ${this.instanceId}] Не удалось сгенерировать QR-код`,
          qrErr,
        );
      }
    });

    this.client.on('ready', () => {
      this.logger.log(
        `[ID: ${this.instanceId}] 🔌 Клиент WhatsApp готов к работе!`,
      );
      this.isReady = true;
      this.isInitializing = false; // Успешно завершили инициализацию
      this.eventsStream.next({ type: 'ready' });
    });

    this.client.on('authenticated', () => {
      this.logger.log(`[ID: ${this.instanceId}] ✅ WhatsApp аутентифицирован`);
      this.eventsStream.next({ type: 'authenticated' });
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error(
        `[ID: ${this.instanceId}] ❌ Ошибка аутентификации: ` + msg,
      );
      this.isInitializing = false; // Инициализация провалена
      this.isReady = false;
      this.eventsStream.next({ type: 'auth_failure', data: msg });
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn(
        `[ID: ${this.instanceId}] 🔌 WhatsApp был отключен: ` + reason,
      );
      this.isReady = false;
      // Библиотека попытается восстановить сессию сама.
      // Не нужно вызывать initAuth() повторно.
      this.eventsStream.next({ type: 'disconnected', data: reason });
    });
  }

  /**
   * Отправляет сообщение на указанный номер.
   * @param phone - Номер телефона в формате <number>@c.us или просто <number>.
   * @param message - Текст сообщения.
   * @throws {Error} если клиент не готов к отправке.
   */
  async sendMessage(phone: string, message: string): Promise<Message> {
    this.ensureReady(); // Сначала проверяем, готов ли клиент

    const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
    this.logger.log(`[ID: ${this.instanceId}] Отправка сообщения на ${chatId}`);
    try {
      const sentMessage = await this.client!.sendMessage(chatId, message);
      return sentMessage;
    } catch (error) {
      this.logger.error(
        `[ID: ${this.instanceId}] Не удалось отправить сообщение на ${chatId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Возвращает Observable для Server-Sent Events (SSE).
   * Используется для отправки QR-кода и статусов на фронтенд.
   */
  getQrStream(): Observable<any> {
    return this.eventsStream.asObservable();
  }

  /**
   * Возвращает текущий статус клиента без запуска инициализации.
   */
  getStatus() {
    return {
      instanceId: this.instanceId,
      isReady: this.isReady,
      isInitializing: this.isInitializing,
    };
  }

  /**
   * Возвращает информацию о текущем подключении WhatsApp.
   * @returns {object | null} - Объект с информацией или null, если клиент не готов.
   */
  getInfo() {
    this.ensureReady();
    return (this.client as any)?.info ?? null;
  }

  /**
   * Внутренний метод для проверки готовности клиента перед выполнением действий.
   * @throws {Error} если клиент не был инициализирован или не готов.
   */
  private ensureReady(): void {
    if (!this.isReady || !this.client) {
      this.logger.warn(
        `[ID: ${this.instanceId}] Попытка выполнить действие до готовности клиента. isReady: ${this.isReady}, client exists: ${!!this.client}`,
      );
      throw new Error(
        'Клиент WhatsApp не готов. Сначала вызовите эндпоинт /auth.',
      );
    }
  }

  /**
   * Вызывается при завершении работы приложения NestJS для корректной очистки ресурсов.
   */
  onModuleDestroy() {
    this.logger.log(
      `[ID: ${this.instanceId}] Завершение работы WhatsApp клиента...`,
    );
    this.client
      ?.destroy()
      .catch((err) => this.logger.error('Ошибка при уничтожении клиента', err));
    this.eventsStream.complete();
  }
}
