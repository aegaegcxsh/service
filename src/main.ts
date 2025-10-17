import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // set a global API prefix so all routes are served under /api/*
  app.setGlobalPrefix('api');

  // Enable CORS for frontend clients. If FRONTEND_URL is set, allow that origin
  // and credentials; otherwise allow all origins (useful for development).
  const frontendOrigin = process.env.FRONTEND_URL ?? '*';
  const credentials = !!process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendOrigin === '*' ? true : frontendOrigin,
    credentials,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    exposedHeaders: 'Authorization',
  });

  // disable Express-generated ETag/conditional responses to avoid 304 responses
  // when API clients expect the full payload every time
  // (this disables automatic ETag generation and conditional GET handling)
  const adapterInstance = app.getHttpAdapter().getInstance() as unknown;
  if (
    typeof adapterInstance === 'object' &&
    adapterInstance !== null &&
    'set' in (adapterInstance as Record<string, unknown>)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (adapterInstance as any).set('etag', false);
  }

  // store a minimal set of known routes so GET /api/routes returns something useful
  const appService = app.get(AppService);
  appService.setRoutes(['GET /api/', 'GET /api/routes']);

  // Increase payload limits to allow large JSON bodies (base64 images) when necessary.
  // Be careful with very large limits in production — prefer multipart/form-data for file uploads.
  app.use(
    bodyParser.json({
      limit: process.env.BODY_PARSER_JSON_LIMIT ?? '50mb',
    }),
  );
  app.use(
    bodyParser.urlencoded({
      limit: process.env.BODY_PARSER_URLENCODE_LIMIT ?? '50mb',
      extended: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
