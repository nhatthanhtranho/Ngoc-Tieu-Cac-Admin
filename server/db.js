import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://192.168.50.163:27017";
const DB_NAME = "ngoc-tieu-cac";

const client = new MongoClient(MONGO_URI);

let db;

export async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ Mongo connected");
  }
  return db;
}

// tiện nếu muốn lấy collection luôn
export async function getCollection(name) {
  const db = await getDB();
  return db.collection(name);
}