import { appendFile, copyFile, readFile } from "fs/promises";
import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
import { fileExists } from "../helper/fileExists";
import { getTextDigest } from "../helper/digest";
import { resolve } from "path";

async function withZeroes(
  filePath: string,
  algorithm: string,
  numZeroes: number
) {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const minNumZeroes = 1;
  if (numZeroes < minNumZeroes) {
    throw `Num zeroes must be at least ${minNumZeroes}`;
  }

  const maxHexChars = 8;
  const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

  const readBuffer = await readFile(filePath);
  const content = readBuffer.toString();

  const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

  let appendNewLine = "";
  if (!hasEndNewLine) {
    appendNewLine = "\n";
  }

  const digestPrefix = "0".repeat(numZeroes);

  let hexNum = -1;
  let hexNumString;
  let digest;

  const startTimestamp = Date.now();
  do {
    hexNum++;
    // eslint-disable-next-line no-magic-numbers
    hexNumString = hexNum.toString(16).toLowerCase();

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }

    const contentWithHex = content + appendNewLine + hexNumString;

    digest = await getTextDigest(contentWithHex, algorithm);

    console.log(`${digest} ${hexNumString}`);
  } while (!digest.startsWith(digestPrefix) && hexNum < maxHexNumValue);

  const msTimeTaken = Date.now() - startTimestamp;
  console.log(
    `\nFinish searching a digest with ${numZeroes} zeroes after ${msTimeTaken}ms.`
  );

  if (!digest.startsWith(digestPrefix)) {
    throw `There could not be found any ${algorithm} digest with ${numZeroes} zeroes using ${maxHexChars} hex characters`;
  }

  console.log(`\nFound digest with at least ${numZeroes} zeroes:`);
  console.log(`  Hex string: ${hexNumString}`);
  console.log(`  Digest: ${digest}\n`);

  const copyPath = `${filePath}.${algorithm}.${digestPrefix}`;
  await copyFile(filePath, copyPath);

  let appendHexNumString = "";
  if (!hasEndNewLine) {
    appendHexNumString = "\n";
  }

  appendHexNumString += hexNumString;
  await appendFile(copyPath, appendHexNumString);

  console.log(`Created file with appended hex code at ${copyPath}`);
}

async function zeroesBlock(
  filename: string,
  algorithm: string,
  numZeroes: number
): Promise<void> {
  const filePath = resolve(process.cwd(), filename);

  try {
    await withZeroes(filePath, algorithm, numZeroes);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const zeroes: Command = {
  name: "zeroes",
  get usage(): string {
    return "<filename> <number of zeroes> [algorithm]";
  },
  async execute(args: Array<string>): Promise<void> {
    const filename = args.shift();
    const numZeroes = args.shift();
    let algorithm = args.shift();

    if (!filename) {
      console.error("Missing filename");
      process.exit(errorExitCode);
    } else if (!numZeroes) {
      console.error("Missing number of zeroes");
      process.exit(errorExitCode);
    } else if (!algorithm) {
      algorithm = defaultAlgorithm;
      console.info(
        `No algorithm provided, falling back to default: ${algorithm}`
      );
    }

    await zeroesBlock(filename, algorithm, parseInt(numZeroes));
  },
};

export { zeroes };