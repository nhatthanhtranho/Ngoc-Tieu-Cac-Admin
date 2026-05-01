import { MongoClient } from "mongodb";
import dotenv from 'dotenv'

dotenv.config()

// eslint-disable-next-line no-undef
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_URI_CLOUD = "mongodb+srv://nhatthanhtranho:nhatthanh123@cluster0.kmr8e.mongodb.net";


const DB_NAME = "ngoc-tieu-cac";

const client = new MongoClient(MONGO_URI);
const client2 = new MongoClient(MONGO_URI_CLOUD);

let db;
let db2;
export async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ Mongo connected");
  }
  return db;
}

export async function getDB2() {
  if (!db2) {
    await client.connect();
    db2 = client.db(DB_NAME);
    console.log("✅ Mongo connected");
  }
  return db;
}

export async function getDBCloud() {
  if (!db) {
    await client2.connect();
    db = client2.db(DB_NAME);
    console.log("✅ Mongo connected");
  }
  return db;
}

// tiện nếu muốn lấy collection luôn
export async function getCollection(name) {
  const db = await getDB();
  return db.collection(name);
}

export async function getCollectionCloud(name) {
  const db2 = await getDBCloud();
  return db2.collection(name);
}