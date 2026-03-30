import mongoose from "mongoose";
import { ensureDefaultAdmin } from "@/lib/server/ensure-default-admin";

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongoose: GlobalMongoose | undefined;
}

const globalWithMongoose = global as typeof global & {
  _mongoose?: GlobalMongoose;
};

const cached: GlobalMongoose = globalWithMongoose._mongoose || {
  conn: null,
  promise: null,
};

export async function connectMongoose() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (cached.conn) {
    await ensureDefaultAdmin();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        dbName: process.env.MONGODB_DB || "school",
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  globalWithMongoose._mongoose = cached;
  await ensureDefaultAdmin();
  return cached.conn;
}
