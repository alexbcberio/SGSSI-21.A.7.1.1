import { readdir, writeFile } from "fs/promises";

import { getFileDigest } from "./src/helper/digest";
import { resolve } from "path";

async function ls(dirPath: string): Promise<Array<string>> {
  const files: Array<string> = [];
  const filesDirent = await readdir(dirPath, {
    withFileTypes: true,
  });

  for (let i = 0; i < filesDirent.length; i++) {
    const file = filesDirent[i];

    if (file.isDirectory()) {
      const subFiles = await ls(resolve(dirPath, file.name));
      const subPath = subFiles.map((f) => `${file.name}/${f}`);

      files.push(...subPath);
    } else {
      files.push(file.name);
    }
  }

  return files;
}

interface FileDigest {
  name: string;
  digest: string;
}

async function directoryFilesDigest(
  directoryPath: string,
  algorithm: string
): Promise<Array<FileDigest>> {
  const files = await ls(directoryPath);
  const digests = await Promise.all(
    files.map((filePath) => {
      const path = resolve(__dirname, "src", filePath);

      return getFileDigest(path, algorithm);
    })
  );

  const filesDigest = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const digest = digests[i];

    filesDigest.push({
      name: file,
      digest,
    });
  }

  return filesDigest;
}

async function main() {
  const directoryName = "./src/";
  const algorithm = "md5";

  const path = resolve(__dirname, directoryName);
  const filesDigests = await directoryFilesDigest(path, algorithm);

  const fileContent = [
    "# Files integrity",
    "",
    `Last updated at \`${new Date().toLocaleString("en-gb")}\``,
    "",
    `| File path | ${algorithm.toUpperCase()} digest |`,
    "| --- | --- |",
  ];

  for (const file of filesDigests) {
    console.log(`${directoryName}${file.name} ${file.digest}`);
    fileContent.push(
      `| \`${directoryName}${file.name}\` | \`${file.digest}\` |`
    );
  }

  await writeFile("md5.md", fileContent.join("\n"));
}

main();
