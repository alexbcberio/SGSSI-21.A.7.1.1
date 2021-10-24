import { defaultAlgorithm, errorExitCode } from "../config";

import { Command } from "../interfaces/Command";
import { getTextDigest } from "../helper/digest";

function processText(text: string, algorithm: string): void {
  const digest = getTextDigest(text, algorithm);

  console.log(digest);
}

const text: Command = {
  name: "text",
  get usage(): string {
    return "<text> [algorithm]";
  },
  execute(args: Array<string>): Promise<void> {
    const text = args.shift();
    let algorithm = args.shift();

    if (!text) {
      console.error("Missing text");
      process.exit(errorExitCode);
    } else if (!algorithm) {
      algorithm = defaultAlgorithm;
      console.info(
        `No algorithm provided, falling back to default: ${algorithm}`
      );
    }

    processText(text, algorithm);

    return Promise.resolve();
  },
};

export { text };
