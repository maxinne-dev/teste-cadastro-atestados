import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { applyBaseSchemaOptions } from '../common/database/index.js';

export type IcdCodeDocument = HydratedDocument<IcdCode>;

@Schema({ timestamps: true })
export class IcdCode {
  // Explicitly declare type to avoid decorator metadata ambiguity during OpenAPI build
  @Prop({ type: String, required: true, unique: true, index: true })
  code!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: false })
  release?: string; // e.g., '2024-01'

  @Prop({ type: Date, default: () => new Date() })
  lastFetchedAt!: Date;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const IcdCodeSchema = SchemaFactory.createForClass(IcdCode);
applyBaseSchemaOptions(IcdCodeSchema);
