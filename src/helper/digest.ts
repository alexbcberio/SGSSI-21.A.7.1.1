import { Hash, createHash } from "crypto";

import { createReadStream } from "fs";
import { errorExitCode } from "../config";
import { fileExists } from "./fileExists";

async function getFileDigest(
  filePath: string,
  algorithm: string
): Promise<string> {
  if (!(await fileExists(filePath))) {
    throw `File ${filePath} does not exist`;
  }

  return new Promise((res) => {
    let hash: Hash;

    try {
      hash = createHash(algorithm);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e.message);
      process.exit(errorExitCode);
    }

    const stream = createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      const fileHash = hash.digest("hex");
      res(fileHash.toLowerCase());
    });
  });
}

function getTextDigest(text: string, algorithm: string): string {
  let hash: Hash;

  try {
    hash = createHash(algorithm);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.log(e.message);
    process.exit(errorExitCode);
  }

  hash.update(text);

  return hash.digest("hex").toLowerCase();
}

export { getFileDigest, getTextDigest };
