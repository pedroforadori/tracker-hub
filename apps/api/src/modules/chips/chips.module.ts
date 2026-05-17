import { Module } from '@nestjs/common';
import { ChipsController } from './chips.controller';
import { ChipsRepository } from './chips.repository';
import { ChipsService } from './chips.service';

@Module({
  controllers: [ChipsController],
  providers: [ChipsService, ChipsRepository],
})
export class ChipsModule {}
