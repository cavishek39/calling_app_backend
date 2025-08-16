import mongoose, { Schema, Document } from 'mongoose'

/**
 * This will allow us to store chat history, track delivery status, and link messages to users.
 */
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId // Reference to the User who sent the message
  receiver: mongoose.Types.ObjectId // Reference to the User who received the message
  content: string
  delivered: boolean
  createdAt: Date
}

/**
 * The Mongoose schema defines the database structure:
 * ref: 'User': Creates a relationship to a User model (enables population)
 * required: true: Makes fields mandatory
 * default: false: Sets undelivered as the default state
 * default: Date.now: Automatically timestamps message creation
 */
const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  delivered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IMessage>('Message', MessageSchema)
