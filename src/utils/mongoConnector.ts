import mongoose from 'mongoose'

const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return mongoose.connection
  }
  try {
    await mongoose.connect(process.env.MONGO_URI as string)
    return mongoose.connection
  } catch (error) {
    throw error
  }
}

export { connectMongoDB, mongoose }
