const { stat } = require("fs").promises;

async function fileExists(filePath) {
	try {
		await stat(filePath);
	} catch (e) {
		return false;
	}

	return true;
}

module.exports = {
	fileExists
};
