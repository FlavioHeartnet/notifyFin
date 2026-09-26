import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from './auth.guard';
import { CurrentTitular } from './current-titular.decorator';
import type { Titular } from './auth.types';

@Controller('titular')
export class TitularController {
  @Get('me')
  @UseGuards(AppAuthGuard)
  currentTitular(@CurrentTitular() titular: Titular): Titular {
    return titular;
  }
}
