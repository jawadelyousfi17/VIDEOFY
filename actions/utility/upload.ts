"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function uploadFile(formData: FormData): Promise<string> {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const tempDir = join(process.cwd(), "temp", "uploads");
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
  const filepath = join(tempDir, filename);

  await writeFile(filepath, buffer);
  return filepath;
}
