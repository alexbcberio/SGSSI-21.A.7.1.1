import { appendFile, copyFile, readFile } from "fs/promises";
import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
import { fileExists } from "../helper/fileExists";
import { getTextDigest } from "../helper/digest";
import { resolve } from "path";

async function searchZeroes(
  filePath: string,
  algorithm: string
): Promise<void> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const maxMs = 60e3;
  const maxHexChars = 8;
  const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

  const readBuffer = await readFile(filePath);
  const content = readBuffer.toString();

  const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

  let appendNewLine = "";
  if (!hasEndNewLine) {
    appendNewLine = "\n";
  }

  let hexNum = -1;
  let hexNumString;
  let digest;

  let optimalDigest;
  let optimalDigestZeroes = 0;
  let optimalString;

  const startTimestamp = Date.now();
  do {
    hexNum++;
    hexNumString = hexNum.toString(16).toLowerCase();

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }
    hexNumString += " G040612";

    const contentWithHex = content + appendNewLine + hexNumString;

    digest = await getTextDigest(contentWithHex, algorithm);

    console.log(`${digest} ${hexNumString}`);

    if (digest.startsWith("0".repeat(optimalDigestZeroes + 1))) {
      let numZeroes = 0;
      for (let i = optimalDigestZeroes + 1; i < digest.length; i++) {
        if (digest.startsWith("0".repeat(i))) {
          numZeroes = i;
        }
      }

      if (numZeroes > optimalDigestZeroes) {
        optimalDigest = digest;
        optimalDigestZeroes = numZeroes;
        optimalString = hexNumString;
      }
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
    await searchZeroes(filePath, algorithm);
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
