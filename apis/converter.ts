import axios from "axios";
import { api } from ".";
import { BACKEND_URL } from "../src/constant";

export type Converter = {
  username: string;
};

export async function createConverter(username: string): Promise<Converter> {
  await api.post("/converters", { username });
  return { username };
}

export async function getConverters(): Promise<Converter[]> {
  const res = await axios.get(`${BACKEND_URL}/converters`);
  return res.data;
}
