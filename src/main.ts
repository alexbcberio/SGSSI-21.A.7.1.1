import { appendFileHash } from "./commands/appendFileHash";
import { mineBlock } from "./commands/mineBlock";
import { processFileHash } from "./commands/processFileHash";
import { processText } from "./commands/processText";
import { validateBlock } from "./commands/validateBlock";
import { zeroesBlock } from "./commands/zeroesBlock";

const fileFlag = "-f";
const textFlag = "-t";
const appendFlag = "-a";
const zeroesFlag = "-z";
const mineFlag = "-m";
const verifyFlag = "-v";

const algorithm = "sha256";

function showHelp() {
  const usage = [
    `${process.argv[0]} ${process.argv[1]}`,
    `${fileFlag} <filepath> |`,
    `${textFlag} <text> |`,
    `${appendFlag} <filepath> |`,
    `${zeroesFlag} <block path> <num zeroes>`,
    `${mineFlag} <block path>`,
    `${verifyFlag} <origin block path> <mined block path>`,
  ];

  const params = [
    `${fileFlag}\tGets digest of a file.`,
    `${textFlag}\tGets digest of a text.`,
    `${appendFlag}\tCreates a copy of a file with its digest at the end.`,
    `${zeroesFlag}\tSearches a block with a prefix of given number of zeroes.`,
    `${mineFlag}\tMines a block getting a prefix with the maximum number of zeroes.`,
    `${verifyFlag}\tVerifies that the mined block complies with the origin block format.`,
  ];

  console.log(usage.map((v, i) => (i > 0 ? `  ${v}` : v)).join("\n"));
  console.log("\nParameters:\n");
  console.log(params.join("\n"));
}

(async function () {
  const argv = process.argv.splice(2);

  if (argv.includes(fileFlag)) {
    const filename = argv[argv.indexOf(fileFlag) + 1];

    if (!filename) {
      console.error("Missing file name");
      process.exit(1);
    }

    await processFileHash(filename, algorithm);
  } else if (argv.includes(textFlag)) {
    const text = argv[argv.indexOf(textFlag) + 1];

    if (!text) {
      console.error("Missing text");
      process.exit(1);
    }

    processText(text, algorithm);
  } else if (argv.includes(appendFlag)) {
    const filename = argv[argv.indexOf(appendFlag) + 1];

    if (!filename) {
      console.error("Missing file name");
      process.exit(1);
    }

    await appendFileHash(filename, algorithm);
  } else if (argv.includes(zeroesFlag)) {
    const filename = argv[argv.indexOf(zeroesFlag) + 1];
    const numZeroes = parseInt(argv[argv.indexOf(zeroesFlag) + 2]);

    if (!filename) {
      console.error("Missing file name");
      process.exit(1);
    } else if (!numZeroes) {
      console.error("Missing number of zeroes");
      process.exit(1);
    }

    await zeroesBlock(filename, algorithm, numZeroes);
  } else if (argv.includes(mineFlag)) {
    const filename = argv[argv.indexOf(mineFlag) + 1];

    if (!filename) {
      console.error("Missing file name");
      process.exit(1);
    }

    await mineBlock(filename, algorithm);
  } else if (argv.includes(verifyFlag)) {
    const originFilename = argv[argv.indexOf(verifyFlag) + 1];
    const minedFilename = argv[argv.indexOf(verifyFlag) + 2];

    if (!originFilename) {
      console.error("Missing origin name");
      process.exit(1);
    } else if (!minedFilename) {
      console.error("Missing mined file name");
      process.exit(1);
    }

    await validateBlock(originFilename, minedFilename, algorithm);
  } else {
    showHelp();
  }
})();
