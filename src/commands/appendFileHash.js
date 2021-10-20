const { readFile, copyFile, appendFile } = require("fs/promises");
const { resolve } = require("path");
const { getFileDigest } = require("../helper/digest");
const { fileExists } = require("../helper/fileExists");

async function appendFileHash(filename, algorithm) {
	const filePath = resolve(process.cwd(), filename);

	try {
		await copyFileWithDigest(filePath, algorithm);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function copyFileWithDigest(filePath, algorithm) {
	if (!(await fileExists(filePath))) {
		rej(`File ${filePath} does not exist`);
		return;
	}

	const copyPath = filePath + "." + algorithm;

	const digest = await getFileDigest(filePath, algorithm);
	await copyFile(filePath, copyPath);

	const readBuffer = await readFile(copyPath);
	const content = readBuffer.toString();

	const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

	let appendDigest = "";
	if (!hasEndNewLine) {
		appendDigest = "\n";
	}

	appendDigest += digest;
	await appendFile(copyPath, appendDigest);

	console.log(`Created file with digest at: ${copyPath}`);
}

module.exports = {
	appendFileHash
};
