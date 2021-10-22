import { stat } from "fs/promises";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
  } catch (e) {
    return false;
  }

  return true;
}

export { fileExists };
