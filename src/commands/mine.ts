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
const defaultStartHexNumber = 0;
const defaultIncrementValue = 1;
const endNewLine = "\n";

interface MineContentOptions {
  signature?: string;
  startHexNumber?: number;
  incrementValue?: number;
}

async function getFileContent(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const buffer = await readFile(filePath);

  return buffer.toString();
}

async function mineContent(
  content: string,
  algorithm: string,
  options?: MineContentOptions
): Promise<string> {
  const signature = options?.signature || "";
  let hexNum = options?.startHexNumber || defaultStartHexNumber;
  const incrementNum = options?.incrementValue || defaultIncrementValue;

  const hasEndNewLine = content.endsWith(endNewLine);

  if (!hasEndNewLine) {
    content += endNewLine;
  }

  let currentDigest;

  let optimalDigest = "";
  let optimalString = "";

  console.log();
  const progress = new Progress("Mining file");
  progress.start();

  const startTimestamp = Date.now();
  do {
    // eslint-disable-next-line no-magic-numbers
    let hexNumString = hexNum.toString(16).toLowerCase();

    hexNum += incrementNum;

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }
    hexNumString += signature;

    const contentWithHex = content + hexNumString;

    currentDigest = await getTextDigest(contentWithHex, algorithm);

    if (!optimalString || currentDigest < optimalDigest) {
      optimalDigest = currentDigest;
      optimalString = hexNumString;
    }

    progress.update();
  } while (Date.now() - startTimestamp <= maxMs && hexNum < maxHexNumValue);

  // eslint-disable-next-line no-magic-numbers
  const secondsTaken = (Date.now() - startTimestamp) / 1000;

  if (!hasEndNewLine) {
    optimalString = endNewLine + optimalString;
  }

  console.log(`\n\nFinished mining after ${secondsTaken}s`);
  console.log(`  Hex string: ${optimalString}`);
  console.log(`  Digest (${algorithm}): ${optimalDigest}\n`);

  return optimalString;
}

async function createMinedBlock(
  filePath: string,
  signature: string,
  algorithm: string
) {
  const copyPath = `${filePath}.${algorithm}.mined`;

  await copyFile(filePath, copyPath);
  await appendFile(copyPath, signature);

  console.log(`Created file with appended hex code at ${copyPath}`);
}

async function mineBlock(filename: string, algorithm: string): Promise<void> {
  const filePath = resolve(process.cwd(), filename);

  try {
    const content = await getFileContent(filePath);
    const signature = await mineContent(content, algorithm, {
      signature: " G040612",
    });
    await createMinedBlock(filePath, signature, algorithm);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const name = "mine";
const cmd = new Commander(name);
cmd.description(
  `Mines the given file for ${
    // eslint-disable-next-line no-magic-numbers
    maxMs / 1e3
  } seconds, searching a hash that starts with as many zeroes as possible`
);

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
