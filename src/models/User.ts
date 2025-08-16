import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  password: string
  avatarUrl?: string
  createdAt: Date
  expoPushToken?: string // Optional field for Expo push notifications
  status: 'active' | 'banned' | 'deleted'
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarUrl: { type: String },
  expoPushToken: { type: String },
  status: {
    type: String,
    enum: ['active', 'banned', 'deleted'],
    default: 'active',
  },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IUser>('User', UserSchema)
