import mongoose, { Schema, Document } from 'mongoose'

export interface ICall extends Document {
  caller: mongoose.Types.ObjectId
  receiver: mongoose.Types.ObjectId
  startedAt: Date
  endedAt?: Date
  status: 'requested' | 'accepted' | 'rejected' | 'ended' | 'missed'
  type: 'audio' | 'video'
  dataUsage: number
}

const CallSchema: Schema = new Schema({
  caller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'rejected', 'ended', 'missed'],
    default: 'requested',
  },
  type: { type: String, enum: ['audio', 'video'], required: true },
  dataUsage: { type: Number, default: 0 }, // in bytes or MB
})

export default mongoose.model<ICall>('Call', CallSchema)
