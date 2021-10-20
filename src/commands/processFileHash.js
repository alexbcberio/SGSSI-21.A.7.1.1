const { resolve } = require("path");
const { getFileDigest } = require("../helper/digest");

async function processFileHash(filename, algorithm) {
	const filePath = resolve(process.cwd(), filename);
	try {
		const digest = await getFileDigest(filePath, algorithm);

		console.log(digest);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

module.exports = {
	processFileHash
};
