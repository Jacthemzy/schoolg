import { MongoClient, MongoClientOptions } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!clientPromise) {
    const options: MongoClientOptions = {
      maxPoolSize: 10,
    };

    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb() {
  const dbName = process.env.MONGODB_DB;

  if (!dbName) {
    throw new Error("MONGODB_DB environment variable is not set");
  }

  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}
