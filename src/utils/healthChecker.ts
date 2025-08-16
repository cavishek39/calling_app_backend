import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectMongoDB } from './mongoConnector'

dotenv.config()

export class HealthChecker {
  static async checkAuthService(): Promise<boolean> {
    return !!process.env.JWT_SECRET && process.env.JWT_SECRET.length > 20
  }

  static async checkDbConnection(): Promise<boolean> {
    return connectMongoDB()
      .then(() => true)
      .catch(() => false)
  }

  static async checkAppCode(): Promise<boolean> {
    // Add more checks as needed
    return true
  }
}
