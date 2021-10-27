import { algorithmOption, fileArgument } from "../helper/command";
import { appendFile, copyFile, readFile } from "fs/promises";

import { Command } from "../interfaces/Command";
import { Command as Commander } from "commander";
import { Progress } from "../helper/Progress";
import { errorExitCode } from "../config";
import { fileExists } from "../helper/fileExists";
import { getTextDigest } from "../helper/digest";
import { resolve } from "path";

const minNumZeroes = 1;
const maxHexChars = 8;
const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

async function withZeroes(
  filePath: string,
  algorithm: string,
  numZeroes: number
) {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  if (numZeroes < minNumZeroes) {
    throw `Num zeroes must be at least ${minNumZeroes}`;
  }

  const content = (await readFile(filePath)).toString();

  const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

  let appendNewLine = "";
  if (!hasEndNewLine) {
    appendNewLine = "\n";
  }

  const digestPrefix = "0".repeat(numZeroes);

  let hexNum = -1;
  let hexNumString;
  let digest;

  const progress = new Progress("Searching, this may take a while");
  progress.start();

  const startTimestamp = Date.now();
  do {
    // eslint-disable-next-line no-magic-numbers
    hexNumString = (hexNum++).toString(16).toLowerCase();

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }

    const contentWithHex = content + appendNewLine + hexNumString;

    digest = await getTextDigest(contentWithHex, algorithm);

    progress.update();
  } while (!digest.startsWith(digestPrefix) && hexNum < maxHexNumValue);

  const msTimeTaken = Date.now() - startTimestamp;
  console.log(
    `\nFinished searching a digest with ${numZeroes} zeroes after ${msTimeTaken}ms.`
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

const name = "zeroes";
const cmd = new Commander(name);
cmd.description(
  `Searches for a ${maxHexChars} hex value where if appended to the file it` +
    ` creates a digest that starts with the provided number of zeroes`
);

cmd.addOption(algorithmOption);

cmd.addArgument(fileArgument);
cmd.argument("<zeroes>", "Number of zeroes the hash has to start with");

cmd.action(async (file, zeroes, { algorithm }) => {
  await zeroesBlock(file, algorithm, parseInt(zeroes));
});

const zeroes: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { zeroes };
