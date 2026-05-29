import { promises as fs } from "fs";
import path from "path";

// Simple file-based persistence. Data lives in /data/*.json locally and
// is exported to Excel via /api/export. No external database required.

function filePath(name: string): string {
  return path.join(process.cwd(), "data", `${name}.json`);
}

async function readFileItems<T>(name: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath(name), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function appendItems<T>(name: string, items: T[]): Promise<boolean> {
  if (items.length === 0) return true;
  try {
    const all = await readFileItems<T>(name);
    all.push(...items);
    await fs.mkdir(path.dirname(filePath(name)), { recursive: true });
    await fs.writeFile(filePath(name), JSON.stringify(all, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function readItems<T>(name: string): Promise<T[]> {
  return readFileItems<T>(name);
}
