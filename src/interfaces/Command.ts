interface Command {
  name: string;
  get usage(): string;
  execute(args: Array<string>): Promise<void>;
}

export { Command };
