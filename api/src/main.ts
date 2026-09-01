import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  RUNTIME_CONFIG,
  RuntimeConfig,
} from './platform/config/runtime-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get<RuntimeConfig>(RUNTIME_CONFIG);
  await app.listen(config.port);
}
void bootstrap();
