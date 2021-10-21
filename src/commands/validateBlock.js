const { readFile } = require("fs").promises;
const { fileExists } = require("../helper/fileExists");
const { getFileDigest } = require("../helper/digest");

async function validateBlock(originFilePath, minedFilePath, algorithm) {
	const exists = await Promise.all([
		fileExists(originFilePath),
		fileExists(minedFilePath)
	]);

	if (exists.includes(false)) {
		console.error("Some of the files does not exist");
		process.exit(1);
	}

	try {
		await checkRules(originFilePath, minedFilePath, algorithm);
		console.log("The file has passed the rules and PoW");
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function checkRules(originFilePath, minedFilePath, algorithm) {
	const originReadBuffer = await readFile(originFilePath);
	const originContent = originReadBuffer.toString();

	const minedReadBuffer = await readFile(minedFilePath);
	let minedContent = minedReadBuffer.toString();

	if (!minedContent.startsWith(originContent)) {
		throw "Mined file does not start with the origin file";
	}

	minedContent = minedContent.replace(originContent, "");
	const lines = minedContent.replace(/\\r\\n/g, "\n").split("\n");
	const lastLine = lines.pop();

	if (lines.length > 0) {
		throw "Demasiadas lineas extra";
	}

	const regexp = new RegExp("^([0-9a-f]){8}[ ]G([0-3][0-9]){1,4}$");
	if (!regexp.test(lastLine)) {
		throw "The block syntax does not correspond with the SGSSI-21 groups'.";
	}

	const digest = await getFileDigest(minedFilePath, algorithm);
	if (!digest.startsWith("0")) {
		throw `The ${algorithm} digest does not start by 0.`;
	}
}

module.exports = { validateBlock };
