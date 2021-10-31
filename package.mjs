/* eslint-disable @typescript-eslint/no-var-requires */
import { readFile, readdir, rename } from "fs/promises";

import { exec } from "pkg";
import newGithubreleaseUrl from "new-github-release-url";
import open from "open";
import { resolve } from "path";
import rimraf from "rimraf";

const mainJsFile = "./dist/main.js";

const binDir = resolve("bin");
const binName = "sgssi-crypto";

function prePackage() {
  return new Promise((res) => {
    rimraf(binDir, res);
  });
}

async function pkg() {
  await exec([mainJsFile, "-c", "package.json", "-C", "br"]);
}

async function postPackage() {
  const { version, repository } = JSON.parse(await readFile("package.json"));
  const currentNames = await readdir(binDir);
  const newNames = currentNames.map(
    (n) => `${binName}-v${version}-${n.split("-").pop()}`
  );

  const renamePromises = [];
  for (let i = 0; i < currentNames.length; i++) {
    const currentPath = resolve(binDir, currentNames[i]);
    const newPath = resolve(binDir, newNames[i]);

    renamePromises.push(rename(currentPath, newPath));
  }

  const url = newGithubreleaseUrl({
    repoUrl: repository.url,
    tag: `v${version}`,
    title: `Version v${version}`,
  });

  await Promise.all([open(url), ...renamePromises]);
}

async function main() {
  await prePackage();
  await pkg();
  await postPackage();
}

main();
