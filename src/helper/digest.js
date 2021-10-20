const { createHash } = require("crypto");
const { createReadStream } = require("fs");
const { fileExists } = require("../helper/fileExists");

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

module.exports = { getFileDigest, getTextDigest };
