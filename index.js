const { copyFile, readFile, appendFile } = require("fs").promises;
const { resolve } = require("path");
const { processFileHash } = require("./src/commands/processFileHash");
const { processText } = require("./src/commands/processText");
const { appendFileHash } = require("./src/commands/appendFileHash");
const { fileExists } = require("./src/helper/fileExists");
const { getTextDigest } = require("./src/helper/digest");

const fileFlag = "-f";
const textFlag = "-t";
const appendFlag = "-a";
const zeroesFlag = "-z";
const mineFlag = "-m";

const algorithm = "sha256";

(async function () {
	const argv = process.argv.splice(2);

	if (argv.includes(fileFlag)) {
		const filename = argv[argv.indexOf(fileFlag) + 1];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		}

		await processFileHash(filename, algorithm);
	} else if (argv.includes(textFlag)) {
		const text = argv[argv.indexOf(textFlag) + 1];

		if (!text) {
			console.error("Missing text");
			process.exit(1);
		}

		processText(text, algorithm);
	} else if (argv.includes(appendFlag)) {
		const filename = argv[argv.indexOf(appendFlag) + 1];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		}

		await appendFileHash(filename, algorithm);
	} else if (argv.includes(zeroesFlag)) {
		const filename = argv[argv.indexOf(zeroesFlag) + 1];
		const numZeroes = argv[argv.indexOf(zeroesFlag) + 2];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		} else if (!numZeroes) {
			console.error("Missing number of zeroes");
			process.exit(1);
		}

		await zeroesBlock(filename, numZeroes);
	} else if (argv.includes(mineFlag)) {
		const filename = argv[argv.indexOf(mineFlag) + 1];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		}

		await mineBlock(filename);
	} else {
		showHelp();
	}
})();

async function zeroesBlock(filename, numZeroes) {
	const filePath = resolve(process.cwd(), filename);

	try {
		await withZeroes(filePath, algorithm, numZeroes);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function mineBlock(filename) {
	const filePath = resolve(process.cwd(), filename);

	try {
		await searchZeroes(filePath, algorithm);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

function showHelp() {
	const usage = [
		`${process.argv[0]} ${process.argv[1]}`,
		`${fileFlag} <filepath> |`,
		`${textFlag} <text> |`,
		`${appendFlag} <filepath> |`,
		`${zeroesFlag} <block path> <num zeroes>`,
		`${mineFlag} <block path>`
	];

	const params = [
		`${fileFlag}\tGets digest of a file.`,
		`${textFlag}\tGets digest of a text.`,
		`${appendFlag}\tCreates a copy of a file with its digest at the end.`,
		`${zeroesFlag}\tSearches a block with a prefix of given number of zeroes.`,
		`${mineFlag}\tMines a block getting a prefix with the maximum number of zeroes.`
	];

	console.log(usage.map((v, i) => (i > 0 ? `  ${v}` : v)).join("\n"));
	console.log("\nParameters:\n");
	console.log(params.join("\n"));
}

async function withZeroes(filePath, algorithm, numZeroes) {
	if (!(await fileExists(filePath))) {
		throw `File ${filePath} does not exist`;
	}

	const minNumZeroes = 1;
	if (numZeroes < minNumZeroes) {
		throw `Num zeroes must be at least ${minNumZeroes}`;
	}

	const maxHexChars = 8;
	const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

	const readBuffer = await readFile(filePath);
	const content = readBuffer.toString();

	const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

	let appendNewLine = "";
	if (!hasEndNewLine) {
		appendNewLine = "\n";
	}

	const digestPrefix = "0".repeat(numZeroes);

	let hexNum = -1;
	let hexNumString;
	let digest;

	const startTimestamp = Date.now();
	do {
		hexNum++;
		hexNumString = hexNum.toString(16).toLowerCase();

		if (hexNumString.length < maxHexChars) {
			hexNumString =
				"0".repeat(maxHexChars - hexNumString.length) + hexNumString;
		}

		const contentWithHex = content + appendNewLine + hexNumString;

		digest = await getTextDigest(contentWithHex, algorithm);

		console.log(digest + " " + hexNumString);
	} while (!digest.startsWith(digestPrefix) && hexNum < maxHexNumValue);

	const msTimeTaken = Date.now() - startTimestamp;
	console.log(
		`\nFinish searching a digest with ${numZeroes} zeroes after ${msTimeTaken}ms.`
	);

	if (!digest.startsWith(digestPrefix)) {
		throw `There could not be found any ${algorithm} digest with ${numZeroes} zeroes using ${maxHexChars} hex characters`;
	}

	console.log(`\nFound digest with at least ${numZeroes} zeroes:`);
	console.log(`  Hex string: ${hexNumString}`);
	console.log(`  Digest: ${digest}\n`);

	const copyPath = filePath + "." + algorithm + "." + digestPrefix;
	await copyFile(filePath, copyPath);

	let appendHexNumString = "";
	if (!hasEndNewLine) {
		appendHexNumString = "\n";
	}

	appendHexNumString += hexNumString;
	await appendFile(copyPath, appendHexNumString);

	console.log(`Created file with appended hex code at ${copyPath}`);
}

async function searchZeroes(filePath, algorithm) {
	if (!(await fileExists(filePath))) {
		throw `File ${filePath} does not exist`;
	}

	const maxSeconds = 60;
	const maxHexChars = 8;
	const maxHexNumValue = parseInt("f".repeat(maxHexChars), 16);

	const readBuffer = await readFile(filePath);
	const content = readBuffer.toString();

	const hasEndNewLine = content.endsWith("\n") || content.endsWith("\r\n");

	let appendNewLine = "";
	if (!hasEndNewLine) {
		appendNewLine = "\n";
	}

	let hexNum = -1;
	let hexNumString;
	let digest;

	let optimalDigest;
	let optimalDigestZeroes = 0;
	let optimalString;

	const startTimestamp = Date.now();
	do {
		hexNum++;
		hexNumString = hexNum.toString(16).toLowerCase();

		if (hexNumString.length < maxHexChars) {
			hexNumString =
				"0".repeat(maxHexChars - hexNumString.length) + hexNumString;
		}
		hexNumString += " G040612";

		const contentWithHex = content + appendNewLine + hexNumString;

		digest = await getTextDigest(contentWithHex, algorithm);

		console.log(digest + " " + hexNumString);

		if (digest.startsWith("0".repeat(optimalDigestZeroes + 1))) {
			let numZeroes = 0;
			for (let i = optimalDigestZeroes + 1; i < digest.length; i++) {
				if (digest.startsWith("0".repeat(i))) {
					numZeroes = i;
				}
			}

			if (numZeroes > optimalDigestZeroes) {
				optimalDigest = digest;
				optimalDigestZeroes = numZeroes;
				optimalString = hexNumString;
			}
		}
	} while (
		Date.now() - startTimestamp <= 1000 * maxSeconds &&
		hexNum < maxHexNumValue
	);

	console.log(`  Hex string: ${optimalString}`);
	console.log(`  Digest: ${optimalDigest}\n`);

	const copyPath = filePath + "." + algorithm + ".mined";
	await copyFile(filePath, copyPath);

	let appendHexNumString = "";
	if (!hasEndNewLine) {
		appendHexNumString = "\n";
	}

	appendHexNumString += optimalString;
	await appendFile(copyPath, appendHexNumString);

	console.log(`Created file with appended hex code at ${copyPath}`);
}
