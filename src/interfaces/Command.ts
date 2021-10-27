import { Command as Commander } from "commander";

interface Command {
  name: string;
  get usage(): string;
  execute(args: Array<string>): Promise<void>;
  cmd: Commander;
}

export { Command };
