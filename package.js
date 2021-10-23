/* eslint-disable @typescript-eslint/no-var-requires */
const { readdir, rename } = require("fs").promises;
const { resolve } = require("path");

const { exec } = require("pkg");
const rimraf = require("rimraf");

const mainJsFile = "./dist/main.js";

const binDir = resolve(__dirname, "bin");
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
  const currentNames = await readdir(binDir);
  const newNames = currentNames.map((v) => `${binName}-${v.split("-").pop()}`);

  const renamePromises = [];
  for (let i = 0; i < currentNames.length; i++) {
    const currentPath = resolve(binDir, currentNames[i]);
    const newPath = resolve(binDir, newNames[i]);

    renamePromises.push(rename(currentPath, newPath));
  }

  await Promise.all(renamePromises);
}

async function main() {
  await prePackage();
  await pkg();
  await postPackage();
}

main();
