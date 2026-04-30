import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/love-cemetery"

let cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose

if (!cached) {
  cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached!.conn) return cached!.conn

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI)
  }

  try {
    cached!.conn = await cached!.promise
    return cached!.conn
  } catch (error) {
    cached!.promise = null  // 실패 시 캐시 초기화하여 재시도 가능
    throw error
  }
}
