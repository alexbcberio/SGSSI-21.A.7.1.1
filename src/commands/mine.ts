import { appendFile, copyFile, readFile } from "fs/promises";
import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
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
      console.log(`New optimal digest found ${currentDigest} ${hexNumString}`);

      optimalDigest = currentDigest;
      optimalString = hexNumString;
    }
  } while (Date.now() - startTimestamp <= maxMs && hexNum < maxHexNumValue);

  console.log(`  Hex string: ${optimalString}`);
  console.log(`  Digest: ${optimalDigest}\n`);

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

const mine: Command = {
  name: "mine",
  get usage(): string {
    return "<filename> [algorithm]";
  },
  async execute(args: Array<string>): Promise<void> {
    const filename = args.shift();
    let algorithm = args.shift();

    if (!filename) {
      console.error("Missing filename");
      process.exit(errorExitCode);
    } else if (!algorithm) {
      algorithm = defaultAlgorithm;
      console.info(
        `No algorithm provided, falling back to default: ${algorithm}`
      );
    }

    await mineBlock(filename, algorithm);
  },
};

export { mine };
