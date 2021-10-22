import { appendFile, copyFile, readFile } from "fs/promises";

import { fileExists } from "../helper/fileExists";
import { getFileDigest } from "../helper/digest";
import { resolve } from "path";

async function appendFileHash(
  filename: string,
  algorithm: string
): Promise<void> {
  const filePath = resolve(process.cwd(), filename);

  try {
    await copyFileWithDigest(filePath, algorithm);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function copyFileWithDigest(
  filePath: string,
  algorithm: string
): Promise<void> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const copyPath = `${filePath}.${algorithm}`;

  const digest = await getFileDigest(filePath, algorithm);
  await copyFile(filePath, copyPath);

  const readBuffer = await readFile(copyPath);
  const content = readBuffer.toString();

  const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

  let appendDigest = "";
  if (!hasEndNewLine) {
    appendDigest = "\n";
  }

  appendDigest += digest;
  await appendFile(copyPath, appendDigest);

  console.log(`Created file with digest at: ${copyPath}`);
}

export { appendFileHash };
