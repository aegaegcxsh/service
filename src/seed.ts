import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';
import { SeedModule } from './seed/seed.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const seedModule = appContext.select(SeedModule);
  const seedService = seedModule.get(SeedService);

  await seedService.run();

  await appContext.close();
}

bootstrap();
