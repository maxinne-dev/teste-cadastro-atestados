import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collaborator, CollaboratorSchema } from './collaborator.schema.js';
import { CollaboratorsService } from './collaborators.service.js';
import { CollaboratorsController } from './collaborators.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule {}
