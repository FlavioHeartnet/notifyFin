import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

export async function bootstrapWorker(): Promise<INestApplicationContext> {
  const application = await NestFactory.createApplicationContext(WorkerModule);
  application.enableShutdownHooks();
  return application;
}

if (require.main === module) {
  void bootstrapWorker().catch(() => {
    Logger.error('Worker failed to start', undefined, 'WorkerBootstrap');
    process.exitCode = 1;
  });
}
