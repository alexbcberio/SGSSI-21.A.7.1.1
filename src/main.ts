import { commands } from "./commands";
import { errorExitCode } from "./config";
import { getHashes } from "crypto";

function showHelp() {
  // eslint-disable-next-line no-magic-numbers
  const usage = `${process.argv[0]} ${process.argv[1]} <command> <args>`;
  const commandsNameUsage = commands.map((c) => `${c.name} ${c.usage}`);
  const availableHashes = getHashes().join(", ");

  console.log(usage);
  console.log(
    `\nAvailable commands:\n${commandsNameUsage
      .map((n) => `  ${n}`)
      .join("\n")}`
  );
  console.log(`\n\nSupported hashes:\n${availableHashes}`);
}

(async function () {
  // eslint-disable-next-line no-magic-numbers
  const argv = process.argv.splice(2);

  const commandName = argv.shift();
  const command = commands.find((c) => c.name === commandName);

  if (!command) {
    showHelp();
    process.exit(errorExitCode);
  }

  await command.execute(argv);
})();
