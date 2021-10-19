const { createHash } = require("crypto");
const { createReadStream } = require("fs");
const { stat, copyFile, readFile, appendFile } = require("fs").promises;
const { resolve } = require("path");

const fileFlag = "-f";
const textFlag = "-t";
const appendFlag = "-a";
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

		await processFileHash(filename);
	} else if (argv.includes(textFlag)) {
		const text = argv[argv.indexOf(textFlag) + 1];

		if (!text) {
			console.error("Missing text");
			process.exit(1);
		}

		processText(text);
	} else if (argv.includes(appendFlag)) {
		const filename = argv[argv.indexOf(appendFlag) + 1];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		}

		await appendFileHash(filename);
	} else if (argv.includes(mineFlag)) {
		const filename = argv[argv.indexOf(mineFlag) + 1];
		const numZeroes = argv[argv.indexOf(mineFlag) + 2];

		if (!filename) {
			console.error("Missing file name");
			process.exit(1);
		} else if (!numZeroes) {
			console.error("Missing number of zeroes");
			process.exit(1);
		}

		await mineBlock(filename, numZeroes);
	} else {
		showHelp();
	}
})();

async function processFileHash(filename) {
	const filePath = resolve(process.cwd(), filename);
	try {
		const digest = await getFileDigest(filePath, algorithm);

		console.log(digest);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

function processText(text) {
	const digest = getTextDigest(text, algorithm);

	console.log(digest);
}

async function appendFileHash(filename) {
	const filePath = resolve(process.cwd(), filename);

	try {
		await copyFileWithDigest(filePath, algorithm);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function mineBlock(filename, numZeroes) {
	const filePath = resolve(process.cwd(), filename);

	try {
		await withZeroes(filePath, algorithm, numZeroes);
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
		`${mineFlag} <block path> <num zeroes>`
	];

	const params = [
		`${fileFlag}\tGets digest of a file.`,
		`${textFlag}\tGets digest of a text.`,
		`${appendFlag}\tCreates a copy of a file with its digest at the end.`,
		`${mineFlag}\tMines a block with a prefix of given number of zeroes.`
	];

	console.log(usage.map((v, i) => (i > 0 ? `  ${v}` : v)).join("\n"));
	console.log("\nParameters:\n");
	console.log(params.join("\n"));
}

async function fileExists(filePath) {
	try {
		await stat(filePath);
	} catch (e) {
		return false;
	}

	return true;
}

async function getFileDigest(filePath, algorithm) {
	return new Promise(async (res, rej) => {
		if (!(await fileExists(filePath))) {
			rej(`File ${filePath} does not exist`);
			return;
		}

		const hash = createHash(algorithm);
		const stream = createReadStream(filePath);

		stream.on("data", data => {
			hash.update(data);
		});

		stream.on("end", () => {
			const fileHash = hash.digest("hex");
			res(fileHash.toLowerCase());
		});
	});
}

function getTextDigest(text, algorithm) {
	const hash = createHash(algorithm);

	hash.update(text);

	return hash.digest("hex").toLowerCase();
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
