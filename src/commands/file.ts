import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
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

const file: Command = {
  name: "file",
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

    await processFileHash(filename, algorithm);
  },
};

export { file };
