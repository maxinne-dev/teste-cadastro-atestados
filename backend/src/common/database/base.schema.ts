import type { Document, Schema } from 'mongoose';

// BaseDocument: common fields expected across models
export interface BaseDocument extends Document {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Apply common schema options: id virtual and clean toJSON/toObject
export function applyBaseSchemaOptions(schema: Schema): void {
  // id virtual from _id
  schema.virtual('id').get(function (this: any) {
    return this._id ? this._id.toString() : undefined;
  });

  // Merge-friendly helper to compose transforms
  const composeTransform = (
    existing: any,
    next: (doc: any, ret: any) => void,
  ) => {
    if (typeof existing === 'function') {
      return (doc: any, ret: any) => {
        existing(doc, ret);
        next(doc, ret);
      };
    }
    return next;
  };

  // Set toJSON options
  const toJSON = (schema as any).options.toJSON || {};
  const toObject = (schema as any).options.toObject || {};

  (schema as any).set('toJSON', {
    virtuals: true,
    versionKey: false, // hides __v
    ...toJSON,
    transform: composeTransform(toJSON.transform, (_doc: any, ret: any) => {
      // Keep _id unless someone else removes it; ensure id is present via virtuals
      return ret;
    }),
  });
  (schema as any).set('toObject', {
    virtuals: true,
    versionKey: false,
    ...toObject,
    transform: composeTransform(toObject.transform, (_doc: any, ret: any) => {
      return ret;
    }),
  });
}
