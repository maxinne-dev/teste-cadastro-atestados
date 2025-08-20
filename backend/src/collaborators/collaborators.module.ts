import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Collaborator, CollaboratorSchema } from './collaborator.schema.js'
import { CollaboratorsService } from './collaborators.service.js'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  providers: [CollaboratorsService],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule {}

