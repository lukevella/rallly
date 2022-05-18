// Import the dependency.
import { MongoClient } from "mongodb";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.LEGACY_MONGODB_URI;

let client;
let clientPromise;

export const getMongoClient = async () => {
  if (!uri) {
    return;
  }

  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  client = new MongoClient(uri);
  clientPromise = client.connect();

  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = clientPromise;
  }

  return clientPromise;
};
