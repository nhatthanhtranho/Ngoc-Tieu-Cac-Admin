import { api } from ".";

export type Converter = {
  username: string;
};

export async function createConverter(username: string): Promise<Converter> {
  await api.post("/converters", { username });
  return { username };
}

export async function getConverters(): Promise<Converter[]> {
  const res = await api.get("/converters");
  return res.data;
}
