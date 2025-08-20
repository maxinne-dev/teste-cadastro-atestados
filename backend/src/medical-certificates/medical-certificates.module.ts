import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MedicalCertificate, MedicalCertificateSchema } from './medical-certificate.schema.js'
import { MedicalCertificatesService } from './medical-certificates.service.js'
import { MedicalCertificatesController } from './medical-certificates.controller.js'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalCertificate.name, schema: MedicalCertificateSchema },
    ]),
  ],
  controllers: [MedicalCertificatesController],
  providers: [MedicalCertificatesService],
  exports: [MedicalCertificatesService],
})
export class MedicalCertificatesModule {}
