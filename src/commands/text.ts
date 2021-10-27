import { Command } from "../interfaces/Command";
import { Command as Commander } from "commander";
import { algorithmOption } from "../helper/command";
import { getTextDigest } from "../helper/digest";

function processText(text: string, algorithm: string): void {
  const digest = getTextDigest(text, algorithm);

  console.log(digest);
}

const name = "text";
const cmd = new Commander(name);

cmd.addOption(algorithmOption);

cmd.argument("<text>", "Text to calculate digest from");

cmd.action((text, { algorithm }) => {
  processText(text, algorithm);
});

const text: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { text };
