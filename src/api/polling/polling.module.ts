import { Module } from '@nestjs/common';
import { PollingController } from './polling.controller';
import { PollingService } from './polling.service';

@Module({
  controllers: [PollingController],
  providers: [PollingService],
})
export class PollingModule {}
