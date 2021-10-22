import { getTextDigest } from "../helper/digest";

function processText(text: string, algorithm: string): void {
	const digest = getTextDigest(text, algorithm);

	console.log(digest);
}

export { processText };
