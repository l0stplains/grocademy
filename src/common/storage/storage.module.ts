import { Global, Module } from '@nestjs/common';
import { STORAGE_TOKEN } from './storage.types';
import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_TOKEN,
      useFactory: () => {
        const driver = (process.env.STORAGE_DRIVER || 'LOCAL').toUpperCase();
        if (driver === 'R2') return new R2StorageService();
        return new LocalStorageService();
      },
    },
  ],
  exports: [STORAGE_TOKEN],
})
export class StorageModule {}
