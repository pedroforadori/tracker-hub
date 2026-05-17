import { Module } from '@nestjs/common';
import { TrackersController } from './trackers.controller';
import { TrackersRepository } from './trackers.repository';
import { TrackersService } from './trackers.service';

@Module({
  controllers: [TrackersController],
  providers: [TrackersService, TrackersRepository],
})
export class TrackersModule {}
