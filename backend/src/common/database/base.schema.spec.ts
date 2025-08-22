import { Schema, model } from 'mongoose'
import { applyBaseSchemaOptions } from './base.schema'

describe('applyBaseSchemaOptions', () => {
  it('adds id virtual and hides __v in toJSON', () => {
    const DummySchema = new Schema({ name: String }, { timestamps: true })
    applyBaseSchemaOptions(DummySchema)
    const Dummy = model('Dummy_' + Math.random().toString(36).slice(2), DummySchema)

    const doc = new Dummy({ name: 'Alice' })
    // emulate timestamps without DB write
    ;(doc as any).createdAt = new Date('2020-01-01T00:00:00.000Z')
    ;(doc as any).updatedAt = new Date('2020-01-02T00:00:00.000Z')

    const json = doc.toJSON() as any
    expect(typeof json.id === 'string' && json.id.length > 0).toBe(true)
    expect(json).not.toHaveProperty('__v')
    expect(json).toHaveProperty('createdAt')
    expect(json).toHaveProperty('updatedAt')
  })
})
