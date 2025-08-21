import { Global, Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Global()
@Module({
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
