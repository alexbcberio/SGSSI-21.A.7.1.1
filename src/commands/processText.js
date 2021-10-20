const { getTextDigest } = require("../helper/digest");

function processText(text, algorithm) {
	const digest = getTextDigest(text, algorithm);

	console.log(digest);
}

module.exports = {
	processText
};
