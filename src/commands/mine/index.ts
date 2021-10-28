import { DigestString, MineOptions, WorkerMessage } from "./mine.interfaces";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { algorithmOption, fileArgument } from "../../helper/command";
import { appendFile, copyFile, readFile } from "fs/promises";

import { Command } from "../../interfaces/Command";
import { Command as Commander } from "commander";
import { Progress } from "../../helper/Progress";
import { cpus } from "os";
import { errorExitCode } from "../../config";
import { fileExists } from "../../helper/fileExists";
import { getTextDigest } from "../../helper/digest";
import { resolve } from "path";

const signature = " G040612";
const maxMs = 60e3;
const maxHexChars = 8;
const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);
const defaultStartHexNumber = 0;
const defaultIncrementValue = 1;
const endNewLine = "\n";

let progressInterval: NodeJS.Timer;

let filePath: string;
let algorithm: string;

let progress: Progress;

async function getFileContent(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  const buffer = await readFile(filePath);

  return buffer.toString();
}

function workerError(error: Error) {
  console.error(`Error on worker: ${error.name}\n${error.message}`);
}

function workerOnline() {
  activeWorkers++;
}

function workerMessage(message: WorkerMessage) {
  const { numWorker, data } = message;

  workerResults[numWorker] = data;
}

async function workerExit(code: number) {
  activeWorkers--;

  // eslint-disable-next-line no-magic-numbers
  if (code !== 0) {
    console.log(`Worker exited with code: ${code}`);
  }

  // eslint-disable-next-line no-magic-numbers
  if (activeWorkers === 0) {
    if (progressInterval) {
      clearInterval(progressInterval);

      progress.terminate();
    }

    // eslint-disable-next-line no-magic-numbers
    workerResults.sort((a, b) => (a.digest > b.digest ? 1 : -1));

    const optimal = workerResults.shift();

    if (!optimal) {
      console.error("Workers have not returned any digest");
      process.exit(errorExitCode);
    }

    console.log("Finished mining");
    console.log(`  Optimal digest: ${optimal.digest}`);
    console.log(`  Optimal string: ${optimal.string}`);

    // eslint-disable-next-line no-use-before-define
    await createMinedBlock(filePath, optimal?.string, algorithm);
  }
}

function mineContent(content: string, options: MineOptions): void {
  const signature = options.signature || "";
  const algorithm = options.algorithm;

  const hasEndNewLine = content.endsWith(endNewLine);

  if (!hasEndNewLine) {
    content += endNewLine;
  }

  const numCpus = cpus().length;

  console.log();
  progress = new Progress(`Mining file with ${numCpus} workers`);
  progress.start();

  // eslint-disable-next-line no-magic-numbers
  progressInterval = setInterval(() => progress.update(), 5e2);

  for (let numWorker = 0; numWorker < numCpus; numWorker++) {
    const options: MineOptions = {
      algorithm,
      incrementNumber: numCpus,
      signature,
      startNumber: numWorker,
    };

    const worker = new Worker(__filename, {
      workerData: {
        numWorker,
        content,
        options,
      },
    });

    worker.addListener("error", workerError);
    worker.addListener("online", workerOnline);
    worker.addListener("message", workerMessage);
    worker.addListener("exit", workerExit);
  }
}

async function createMinedBlock(
  filePath: string,
  signature: string,
  algorithm: string
) {
  const copyPath = `${filePath}.${algorithm}.mined`;

  await copyFile(filePath, copyPath);
  await appendFile(copyPath, signature);

  console.log(`Created file with appended hex code at ${copyPath}`);
}

async function mineBlock(filename: string, algorithm: string): Promise<void> {
  filePath = resolve(process.cwd(), filename);

  try {
    const content = await getFileContent(filePath);

    mineContent(content, {
      algorithm,
      signature,
    });
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
}

async function mineLoop(
  content: string,
  options: MineOptions
): Promise<DigestString> {
  const { algorithm, startNumber } = options;

  const signature = options.signature || "";
  const incrementNumber = options.incrementNumber || defaultIncrementValue;
  let hexNum = startNumber || defaultStartHexNumber;
  let currentDigest: string;

  const optimal: DigestString = {
    digest: "",
    string: "",
  };

  const startTimestamp = Date.now();
  do {
    // eslint-disable-next-line no-magic-numbers
    let hexNumString = hexNum.toString(16).toLowerCase();

    hexNum += incrementNumber;

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }
    hexNumString += signature;

    const contentWithHex = content + hexNumString;

    currentDigest = await getTextDigest(contentWithHex, algorithm);

    if (!optimal.string || currentDigest < optimal.digest) {
      optimal.digest = currentDigest;
      optimal.string = hexNumString;
    }
  } while (Date.now() - startTimestamp <= maxMs && hexNum < maxHexNumValue);

  if (hexNum >= maxHexNumValue) {
    console.log("Worker overflowed");
  }

  return optimal;
}

if (!isMainThread) {
  const { numWorker, content, options } = workerData;

  mineLoop(content, options).then((optimal) => {
    parentPort?.postMessage({
      numWorker,
      data: optimal,
    });

    // eslint-disable-next-line no-magic-numbers
    process.exit(0);
  });
}

const name = "mine";
const cmd = new Commander(name);
cmd.description(
  `Mines the given file for ${
    // eslint-disable-next-line no-magic-numbers
    maxMs / 1e3
  } seconds, searching a hash that starts with as many zeroes as possible`
);

cmd.addOption(algorithmOption);

cmd.addArgument(fileArgument);

cmd.action(async (file, options) => {
  algorithm = options.algorithm;

  await mineBlock(file, algorithm);
});

const mine: Command = {
  name,
  get usage(): string {
    return cmd.usage();
  },
  async execute(args: Array<string>): Promise<void> {
    await cmd.parseAsync(args);
  },
  cmd,
};

export { mine };
