import { readFile, writeFile } from "node:fs/promises";

export async function readJsonFile<T>(path: string): Promise<T> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as T;
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(path, text, "utf8");
}
