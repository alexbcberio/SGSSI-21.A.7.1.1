import { algorithmOption, fileArgument } from "../helper/command";
import { appendFile, copyFile, readFile } from "fs/promises";

import { Command } from "../interfaces/Command";
import { Command as Commander } from "commander";
import { Progress } from "../helper/Progress";
import { errorExitCode } from "../config";
import { fileExists } from "../helper/fileExists";
import { getTextDigest } from "../helper/digest";
import { resolve } from "path";

const maxMs = 60e3;
const maxHexChars = 8;
const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

async function mineFile(filePath: string, algorithm: string): Promise<void> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const content = (await readFile(filePath)).toString();
  const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

  let appendNewLine = "";
  if (!hasEndNewLine) {
    appendNewLine = "\n";
  }

  let hexNum = 0;
  let hexNumString;
  let currentDigest;

  let optimalDigest = "a";
  let optimalString;

  console.log();
  const progress = new Progress("Mining file");
  progress.start();

  const startTimestamp = Date.now();
  do {
    // eslint-disable-next-line no-magic-numbers
    hexNumString = (hexNum++).toString(16).toLowerCase();

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }
    hexNumString += " G040612";

    const contentWithHex = content + appendNewLine + hexNumString;

    currentDigest = await getTextDigest(contentWithHex, algorithm);

    if (currentDigest <= optimalDigest) {
      optimalDigest = currentDigest;
      optimalString = hexNumString;
    }

    progress.update();
  } while (Date.now() - startTimestamp <= maxMs && hexNum < maxHexNumValue);

  // eslint-disable-next-line no-magic-numbers
  const secondsTaken = (Date.now() - startTimestamp) / 1000;

  console.log(`\nFinished mining after ${secondsTaken}s`);
  console.log(`  Hex string: ${optimalString}`);
  console.log(`  Digest (${algorithm}): ${optimalDigest}\n`);

  const copyPath = `${filePath}.${algorithm}.mined`;
  await copyFile(filePath, copyPath);

  let appendHexNumString = "";
  if (!hasEndNewLine) {
    appendHexNumString = "\n";
  }

  appendHexNumString += optimalString;
  await appendFile(copyPath, appendHexNumString);

  console.log(`Created file with appended hex code at ${copyPath}`);
}

async function mineBlock(filename: string, algorithm: string): Promise<void> {
  const filePath = resolve(process.cwd(), filename);

  try {
    await mineFile(filePath, algorithm);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const name = "mine";
const cmd = new Commander(name);

cmd.addOption(algorithmOption);

cmd.addArgument(fileArgument);

cmd.action(async (file, { algorithm }) => {
  await mineBlock(file, algorithm);
});

const mine: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { mine };
