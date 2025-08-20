import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from './user.schema.js'
import { UsersService } from './users.service.js'
import { UsersController } from './users.controller.js'
import { PasswordService } from '../auth/password.service.js'
import { AuditModule } from '../audit/audit.module.js'

@Module({
  imports: [AuditModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
