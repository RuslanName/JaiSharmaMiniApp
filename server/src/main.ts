import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { config } from './config/constants';
import { getAllowedOrigins } from './config/origin.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(config.PORT);
}
bootstrap();
