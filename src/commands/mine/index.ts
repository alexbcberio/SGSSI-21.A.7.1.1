import { DigestString, MineOptions, WorkerMessage } from "./mine.interfaces";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { algorithmOption, fileArgument } from "../../helper/command";
import { appendFile, copyFile, readFile } from "fs/promises";
import { endNewLine, maxMs } from "./mine.config";

import { Command } from "../../interfaces/Command";
import { Command as Commander } from "commander";
import { Progress } from "../../helper/Progress";
import { cpus } from "os";
import { errorExitCode } from "../../config";
import { fileExists } from "../../helper/fileExists";
import { mineLoop } from "./mine.worker";
import { resolve } from "path";

const signature = " G040612";
const workerResults: Array<DigestString> = [];

let progressInterval: NodeJS.Timer;
let activeWorkers = 0;
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

function workerExit(code: number): Promise<DigestString | void> {
  activeWorkers--;

  // eslint-disable-next-line no-magic-numbers
  if (code !== 0) {
    console.error(`Worker exited with code: ${code}`);
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
      throw "Workers have not returned any digest";
    }

    return Promise.resolve(optimal);
  }

  return Promise.resolve();
}

function mineContent(
  content: string,
  options: MineOptions
): Promise<DigestString> {
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

  return new Promise((res) => {
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
      worker.addListener("exit", async (code: number) => {
        const optimal = await workerExit(code);

        if (optimal) {
          res(optimal);
        }
      });
    }
  });
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
  const filePath = resolve(process.cwd(), filename);

  try {
    const content = await getFileContent(filePath);

    const { digest, string } = await mineContent(content, {
      algorithm,
      signature,
    });

    console.log("Finished mining");
    console.log(`  Optimal digest: ${digest}`);
    console.log(`  Optimal string: ${string}`);

    await createMinedBlock(filePath, string, algorithm);
  } catch (e) {
    console.error(e);
    process.exit(errorExitCode);
  }
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

cmd.action(async (file, { algorithm }) => {
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
