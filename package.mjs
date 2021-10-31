import { readdir, rename } from "fs/promises";

import { currentVersion } from "./dist/config.js";
import { exec } from "pkg";
import newGithubreleaseUrl from "new-github-release-url";
import open from "open";
import { resolve } from "path";
import rimraf from "rimraf";

const mainJsFile = "./dist/main.js";

const binDir = resolve("bin");
const binName = "sgssi-crypto";

const compressionAlgorithm = "br";
const noCompressFlag = "--no-compress";
const noOpenReleasePageFlag = "--no-open-release";

function prePackage() {
  return new Promise((res) => {
    rimraf(binDir, res);
  });
}

async function pkg() {
  const args = [mainJsFile, "-c", "package.json"];

  if (!process.argv.includes(noCompressFlag)) {
    console.log(
      `Building binaries compressed with ${compressionAlgorithm}, use ${noCompressFlag} flag to skip compression`
    );
    args.push.apply(args, ["-C", compressionAlgorithm]);
  }

  await exec(args);
}

async function postPackage() {
  const version = process.env.npm_package_version;
  const repositoryUrl = process.env.npm_package_repository_url;

  if (!version || !repositoryUrl) {
    console.error(
      "No npm_package_version nor npm_package_repository_url variables are set. Is the script being run with npm or yarn?"
    );
    // eslint-disable-next-line no-magic-numbers
    process.exit(1);
  }

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
    repoUrl: repositoryUrl,
    tag: `v${version}`,
    title: `Version v${version}`,
  });

  let openReleasePagePromise = Promise.resolve();
  if (!process.argv.includes(noOpenReleasePageFlag)) {
    console.log(
      `Opening new Github release url, set ${noOpenReleasePageFlag} flag to prevent it`
    );
    openReleasePagePromise = open(url);
  }

  await Promise.all([openReleasePagePromise, ...renamePromises]);
}

async function main() {
  const npmPackageVersion = process.env.npm_package_version;

  if (currentVersion !== npmPackageVersion) {
    console.error(
      `Version mismatch, package.json (${npmPackageVersion}) and version set on config (${currentVersion}) are not the same`
    );
    process.exit(1);
  }

  await prePackage();
  await pkg();
  await postPackage();
}

main();
