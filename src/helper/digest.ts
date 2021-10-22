import { createHash } from "crypto";
import { createReadStream } from "fs";
import { fileExists } from "./fileExists";

async function getFileDigest(
  filePath: string,
  algorithm: string
): Promise<string> {
  return new Promise(async (res, rej) => {
    if (!(await fileExists(filePath))) {
      rej(`File ${filePath} does not exist`);
      return;
    }

    const hash = createHash(algorithm);
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
  const hash = createHash(algorithm);

  hash.update(text);

  return hash.digest("hex").toLowerCase();
}

export { getFileDigest, getTextDigest };
