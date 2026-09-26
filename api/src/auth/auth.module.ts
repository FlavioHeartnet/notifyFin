import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppAuthGuard } from './auth.guard';
import { TitularController } from './titular.controller';
import {
  DefaultGoogleOAuthClientFactory,
  GOOGLE_OAUTH_CLIENT_FACTORY,
} from './google-oauth.provider';

@Module({
  controllers: [AuthController, TitularController],
  providers: [
    AuthService,
    AppAuthGuard,
    {
      provide: GOOGLE_OAUTH_CLIENT_FACTORY,
      useClass: DefaultGoogleOAuthClientFactory,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
