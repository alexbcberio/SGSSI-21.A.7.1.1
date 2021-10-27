import { algorithmOption, fileArgument } from "../helper/command";

import { Command } from "../interfaces/Command";
import { Command as Commander } from "commander";
import { errorExitCode } from "../config";
import { getFileDigest } from "../helper/digest";
import { resolve } from "path";

async function processFileHash(
  filename: string,
  algorithm: string
): Promise<void> {
  const filePath = resolve(process.cwd(), filename);
  try {
    const digest = await getFileDigest(filePath, algorithm);

    console.log(digest);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

const name = "file";
const cmd = new Commander(name);

cmd.addOption(algorithmOption);

cmd.addArgument(fileArgument);

cmd.action(async (filename, { algorithm }) => {
  await processFileHash(filename, algorithm);
});

const file: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { file };
