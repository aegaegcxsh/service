import { Controller, Get, Sse } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { map } from 'rxjs/operators';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * 🔐 Инициализация авторизации
   */
  @Get('auth')
  async auth() {
    await this.whatsappService.initAuth();
    return { message: 'Авторизация WhatsApp инициализирована' };
  }

  /**
   * 🧾 Проверка статуса авторизации
   */
  @Get('check')
  check() {
    return this.whatsappService.getStatus();
  }

  /**
   * 📡 Подключение к SSE для получения QR-кодов в реальном времени
   */
  @Sse('qr')
  qrStream() {
    return this.whatsappService
      .getQrStream()
      .pipe(map((qr: unknown) => ({ data: qr })));
  }

  @Get('info')
  info(): unknown {
    return this.whatsappService.getInfo();
  }
}
