import { getFileDigest } from "../helper/digest";
import { resolve } from "path";

async function processFileHash(
  filename: string,
  algorithm: string
): Promise<void> {
  const filePath = resolve(process.cwd(), filename);
  try {
    const digest = await getFileDigest(filePath, algorithm);

    console.log(digest);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

export { processFileHash };
