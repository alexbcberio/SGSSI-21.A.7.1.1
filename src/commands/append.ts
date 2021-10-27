import { algorithmOption, fileArgument } from "../helper/command";
import { appendFile, copyFile, readFile } from "fs/promises";

import { Command } from "../interfaces/Command";
import { Command as Commander } from "commander";
import { errorExitCode } from "../config";
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

  const [digest, , readBuffer] = await Promise.all([
    getFileDigest(filePath, algorithm),
    copyFile(filePath, copyPath),
    readFile(filePath),
  ]);

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

const name = "append";
const cmd = new Commander(name);
cmd.description(
  "Creates a copy of a file with its hash appended at the last line"
);

cmd.addOption(algorithmOption);

cmd.addArgument(fileArgument);

cmd.action(async (file, { algorithm }) => {
  await appendFileHash(file, algorithm);
});

const append: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { append };
