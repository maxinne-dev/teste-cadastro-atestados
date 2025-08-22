import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { applyBaseSchemaOptions } from '../common/database/index.js';

export type IcdCodeDocument = HydratedDocument<IcdCode>;

@Schema({ timestamps: true })
export class IcdCode {
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: false })
  release?: string; // e.g., '2024-01'

  @Prop({ type: Date, default: () => new Date() })
  lastFetchedAt!: Date;
}

export const IcdCodeSchema = SchemaFactory.createForClass(IcdCode);
applyBaseSchemaOptions(IcdCodeSchema);
