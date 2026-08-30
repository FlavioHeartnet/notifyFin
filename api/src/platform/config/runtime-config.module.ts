import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  parseRuntimeConfig,
  RUNTIME_CONFIG,
  RuntimeConfig,
} from './runtime-config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      validate: parseRuntimeConfig,
    }),
  ],
  providers: [
    {
      provide: RUNTIME_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService): RuntimeConfig =>
        Object.freeze({
          environment:
            config.getOrThrow<RuntimeConfig['environment']>('environment'),
          port: config.getOrThrow<number>('port'),
          administrativeHostname: config.getOrThrow<string>(
            'administrativeHostname',
          ),
          publicHostname: config.getOrThrow<string>('publicHostname'),
        }),
    },
  ],
  exports: [RUNTIME_CONFIG],
})
export class RuntimeConfigModule {}
