import { appendFile, copyFile, readFile } from "fs/promises";
import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
import { fileExists } from "../helper/fileExists";
import { getFileDigest } from "../helper/digest";
import { resolve } from "path";

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

async function appendFileHash(
  filename: string,
  algorithm: string
): Promise<void> {
  const filePath = resolve(process.cwd(), filename);

  try {
    await copyFileWithDigest(filePath, algorithm);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const append: Command = {
  name: "append",
  get usage(): string {
    return "<filename> [algorithm]";
  },
  async execute(args: Array<string>): Promise<void> {
    const filename = args.shift();
    let algorithm = args.shift();

    if (!filename) {
      console.error("Missing file path");
      process.exit(errorExitCode);
    } else if (!algorithm) {
      algorithm = defaultAlgorithm;
      console.info(
        `No algorithm provided, falling back to default: ${algorithm}`
      );
    }

    await appendFileHash(filename, algorithm);
  },
};

export { append };
