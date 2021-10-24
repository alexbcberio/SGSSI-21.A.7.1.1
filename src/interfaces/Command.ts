interface Command {
  name: string;
  execute(args: Array<string>): Promise<void>;
}

export { Command };
