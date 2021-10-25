import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
import { fileExists } from "../helper/fileExists";
import { getFileDigest } from "../helper/digest";
import { readFile } from "fs/promises";
import { resolve } from "path";

async function checkRules(
  originFilePath: string,
  minedFilePath: string,
  algorithm: string
): Promise<void> {
  const [originReadBuffer, minedReadBuffer] = await Promise.all([
    readFile(originFilePath),
    readFile(minedFilePath),
  ]);

  const originContent = originReadBuffer.toString();
  let minedContent = minedReadBuffer.toString();

  if (!minedContent.startsWith(originContent)) {
    throw "Mined file does not start with the origin file";
  }

  minedContent = minedContent.replace(originContent, "");
  const lines = minedContent.replace(/\\r\\n/g, "\n").split("\n");
  const lastLine = lines.pop();

  if (!lastLine) {
    throw "The mined file is missing the signature line.";
  }

  // eslint-disable-next-line no-magic-numbers
  if (lines.length > 0) {
    throw "The mined file contains extra lines.";
  }

  const regexp = new RegExp("^([0-9a-f]){8}[ ]G([0-3][0-9]){1,4}$");
  if (!regexp.test(lastLine)) {
    throw "The block syntax does not correspond with the SGSSI-21 groups.";
  }

  const digest = await getFileDigest(minedFilePath, algorithm);
  if (!digest.startsWith("0")) {
    throw `The ${algorithm} digest does not start by 0.`;
  }
}

async function validateBlock(
  originFilename: string,
  minedFilename: string,
  algorithm: string
): Promise<void> {
  const originFilePath = resolve(originFilename);
  const minedFilePath = resolve(minedFilename);

  const exists = await Promise.all([
    fileExists(originFilePath),
    fileExists(minedFilePath),
  ]);

  if (exists.includes(false)) {
    console.error("Some of the files does not exist");
    process.exit(errorExitCode);
  }

  try {
    await checkRules(originFilePath, minedFilePath, algorithm);
    console.log("The file has passed the rules and PoW");
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const validate: Command = {
  name: "validate",
  get usage(): string {
    return "<origin filename> <mined filename> [algorithm]";
  },
  async execute(args: Array<string>): Promise<void> {
    const originFilename = args.shift();
    const minedFilename = args.shift();
    let algorithm = args.shift();

    if (!originFilename) {
      console.error("Missing origin filename");
      process.exit(errorExitCode);
    } else if (!minedFilename) {
      console.error("Missing mined filename");
      process.exit(errorExitCode);
    } else if (!algorithm) {
      algorithm = defaultAlgorithm;
      console.info(
        `No algorithm provided, falling back to default: ${algorithm}`
      );
    }

    await validateBlock(originFilename, minedFilename, algorithm);
  },
};

export { validate };
