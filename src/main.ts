import { commands } from "./commands";
import { errorExitCode } from "./config";
import { getHashes } from "crypto";

function showHelp() {
  // eslint-disable-next-line no-magic-numbers
  const usage = `\nUsage: <command> ...`;
  const commandsNameUsage = commands.map((c) => `${c.name} ${c.usage}`);
  const availableHashes = getHashes()
    .map((v) => `  ${v}`)
    .join("\n");

  console.log(usage);
  console.log(
    `\nAvailable commands:\n${commandsNameUsage
      .map((n) => `  ${n}`)
      .join("\n")}`
  );
  console.log(`\nSupported hash algorithms:\n${availableHashes}`);
}

(async function () {
  // eslint-disable-next-line no-magic-numbers
  const commandName = process.argv.splice(2, 1).shift();
  const command = commands.find((c) => c.name === commandName);

  if (!command) {
    showHelp();
    process.exit(errorExitCode);
  }

  const { cmd } = command;

  cmd.showHelpAfterError();
  await cmd.parseAsync(process.argv);
})();
